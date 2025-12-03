/**
 * Generate a unique ID using current timestamp and random string.
 * @returns {string}
 */
export function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  );
}

/**
 * Safely access a nested property in an object.
 * @param {object} obj - The object
 * @param {string[]} path - Array of keys
 * @param {any} [defaultValue] - Value to return if not found
 * @returns {any}
 */
export function getNested(obj: any, path: string[], defaultValue?: any): any {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? defaultValue;
} 