/**
 * Validate an email address using a simple regex.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a password (min 6 chars, at least 1 letter and 1 number).
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
} 