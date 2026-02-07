// File MIME type validation utility
import { fileTypeFromBuffer } from 'file-type';
import { BadRequestError } from '../middleware/errorHandler.js';

/**
 * Allowed MIME types for file uploads
 */
const ALLOWED_MIME_TYPES = {
  gpx: ['application/gpx+xml', 'text/xml', 'application/xml'],
  tcx: ['application/tcx+xml', 'text/xml', 'application/xml'],
  fit: ['application/vnd.ant.fit'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

/**
 * Maximum file sizes (in bytes)
 */
const MAX_FILE_SIZES = {
  gpx: 10 * 1024 * 1024,  // 10 MB
  tcx: 10 * 1024 * 1024,  // 10 MB
  fit: 5 * 1024 * 1024,   // 5 MB
  image: 5 * 1024 * 1024, // 5 MB
} as const;

/**
 * File extension to category mapping
 */
const EXTENSION_TO_CATEGORY: { [key: string]: keyof typeof ALLOWED_MIME_TYPES } = {
  '.gpx': 'gpx',
  '.tcx': 'tcx',
  '.fit': 'fit',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.gif': 'image',
  '.webp': 'image',
};

interface ValidationResult {
  valid: boolean;
  mimeType?: string;
  detectedExtension?: string;
  error?: string;
}

/**
 * Validate file size
 */
export function validateFileSize(
  buffer: Buffer,
  category: keyof typeof MAX_FILE_SIZES
): void {
  const maxSize = MAX_FILE_SIZES[category];
  
  if (buffer.length > maxSize) {
    throw new BadRequestError(
      `Fichier trop volumineux. Maximum autorisé: ${Math.round(maxSize / 1024 / 1024)} MB`
    );
  }
}

/**
 * Validate file MIME type by inspecting file content
 * This prevents users from uploading malicious files by just changing the extension
 */
export async function validateFileMimeType(
  buffer: Buffer,
  expectedCategory: keyof typeof ALLOWED_MIME_TYPES,
  filename?: string
): Promise<ValidationResult> {
  // Validate file size first
  try {
    validateFileSize(buffer, expectedCategory);
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid file size',
    };
  }

  // Get the real MIME type from file content (magic numbers)
  const fileTypeResult = await fileTypeFromBuffer(buffer);

  // For XML-based formats (GPX, TCX), file-type may return undefined
  // because XML is text-based. We need to check the content manually.
  if (expectedCategory === 'gpx' || expectedCategory === 'tcx') {
    return validateXmlFile(buffer, expectedCategory, filename);
  }

  // For binary formats (FIT, images), use file-type detection
  if (!fileTypeResult) {
    return {
      valid: false,
      error: 'Type de fichier non reconnu ou corrompu',
    };
  }

  const allowedTypes = ALLOWED_MIME_TYPES[expectedCategory];
  const isValid = allowedTypes.some((type: string) => type === fileTypeResult.mime);

  if (!isValid) {
    return {
      valid: false,
      mimeType: fileTypeResult.mime,
      detectedExtension: fileTypeResult.ext,
      error: `Type de fichier invalide. Attendu: ${expectedCategory.toUpperCase()}, Détecté: ${fileTypeResult.ext.toUpperCase()}`,
    };
  }

  return {
    valid: true,
    mimeType: fileTypeResult.mime,
    detectedExtension: fileTypeResult.ext,
  };
}

/**
 * Validate XML-based files (GPX, TCX)
 */
function validateXmlFile(
  buffer: Buffer,
  expectedCategory: 'gpx' | 'tcx',
  filename?: string
): ValidationResult {
  try {
    const content = buffer.toString('utf-8');

    // Check if it's valid XML
    if (!content.trim().startsWith('<?xml') && !content.trim().startsWith('<')) {
      return {
        valid: false,
        error: 'Le fichier n\'est pas un fichier XML valide',
      };
    }

    // Check for GPX-specific markers
    if (expectedCategory === 'gpx') {
      if (!content.includes('<gpx') && !content.includes('xmlns="http://www.topografix.com/GPX')) {
        return {
          valid: false,
          error: 'Le fichier n\'est pas un fichier GPX valide (balises GPX manquantes)',
        };
      }
    }

    // Check for TCX-specific markers
    if (expectedCategory === 'tcx') {
      if (!content.includes('<TrainingCenterDatabase') && !content.includes('xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase')) {
        return {
          valid: false,
          error: 'Le fichier n\'est pas un fichier TCX valide (balises TCX manquantes)',
        };
      }
    }

    // Check file extension if provided
    if (filename) {
      const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      const expectedExt = `.${expectedCategory}`;
      
      if (ext !== expectedExt) {
        return {
          valid: false,
          error: `Extension incorrecte. Attendu: ${expectedExt}, Reçu: ${ext}`,
        };
      }
    }

    return {
      valid: true,
      mimeType: `application/${expectedCategory}+xml`,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Erreur lors de la validation du fichier XML',
    };
  }
}

/**
 * Validate image file
 */
export async function validateImageFile(buffer: Buffer): Promise<ValidationResult> {
  return validateFileMimeType(buffer, 'image');
}

/**
 * Validate GPX file
 */
export async function validateGpxFile(buffer: Buffer, filename?: string): Promise<ValidationResult> {
  return validateFileMimeType(buffer, 'gpx', filename);
}

/**
 * Validate TCX file
 */
export async function validateTcxFile(buffer: Buffer, filename?: string): Promise<ValidationResult> {
  return validateFileMimeType(buffer, 'tcx', filename);
}

/**
 * Validate FIT file
 */
export async function validateFitFile(buffer: Buffer): Promise<ValidationResult> {
  return validateFileMimeType(buffer, 'fit');
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path separators and special characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .substring(0, 255); // Limit length
}

/**
 * Get file category from extension
 */
export function getFileCategoryFromExtension(filename: string): keyof typeof ALLOWED_MIME_TYPES | null {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return EXTENSION_TO_CATEGORY[ext] || null;
}
