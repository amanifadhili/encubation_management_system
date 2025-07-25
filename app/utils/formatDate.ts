/**
 * Format a date string or Date object to a readable string (e.g., 'Jun 1, 2024, 10:00 AM').
 * @param {string | Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
} 