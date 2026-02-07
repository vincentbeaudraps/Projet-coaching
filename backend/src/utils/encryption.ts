import crypto from 'crypto';

// AES-256-GCM encryption for sensitive medical data
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }
  return Buffer.from(secret, 'hex');
}

export function encryptSensitiveData(text: string | number | null): string | null {
  if (text === null || text === undefined || text === '') {
    return null;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const textStr = String(text);
    let encrypted = cipher.update(textStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Format: iv:encrypted:tag
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

export function decryptSensitiveData(encryptedText: string | null): string | null {
  if (!encryptedText) {
    return null;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

// Generate a secure encryption key (run once, store in .env)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex'); // 256 bits
}

// Hash passwords (already using bcrypt, but keeping this for other uses)
export function hashData(data: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(data, salt, ITERATIONS, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyHash(data: string, hashedData: string): boolean {
  const parts = hashedData.split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  const salt = parts[0];
  const originalHash = parts[1];
  const hash = crypto.pbkdf2Sync(data, salt, ITERATIONS, 64, 'sha512').toString('hex');
  
  return hash === originalHash;
}
