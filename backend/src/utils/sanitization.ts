import xss from 'xss';

// Custom XSS filter configuration
const xssOptions = {
  whiteList: {
    // Allow basic text formatting
    b: [],
    i: [],
    em: [],
    strong: [],
    br: [],
    p: [],
    // Allow links with limited attributes
    a: ['href', 'title', 'target'],
    // Allow lists
    ul: [],
    ol: [],
    li: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Sanitize user input to prevent XSS attacks
 * Use this on all user-provided text before storing in database or displaying
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) {
    return '';
  }
  
  return xss(input, xssOptions);
}

/**
 * Sanitize plain text (no HTML allowed at all)
 */
export function sanitizePlainText(input: string | null | undefined): string {
  if (!input) {
    return '';
  }
  
  return xss(input, { whiteList: {}, stripIgnoreTag: true });
}

/**
 * Sanitize an object's string properties recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value) as any;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) => 
        typeof item === 'string' ? sanitizeInput(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : 
        item
      ) as any;
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) {
    return '';
  }
  
  // Remove any HTML and trim
  const cleaned = xss(email.trim().toLowerCase(), { whiteList: {}, stripIgnoreTag: true });
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format');
  }
  
  return cleaned;
}

/**
 * Sanitize SQL-like strings (additional layer of protection)
 * Note: Should always use parameterized queries, but this adds defense in depth
 */
export function sanitizeSqlString(input: string | null | undefined): string {
  if (!input) {
    return '';
  }
  
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/(-{2}|\/\*|\*\/)/g, '') // Remove SQL comments
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|OR|AND)\b/gi, ''); // Remove SQL keywords
}
