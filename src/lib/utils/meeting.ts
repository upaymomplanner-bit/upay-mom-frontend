// Utility functions for meeting data transformation

/**
 * Maps priority from JSON (string "1"-"5") to database enum
 * Database: 'urgent', 'important', 'medium', 'low'
 */
export function mapPriorityToDb(priority: string): string {
  const priorityMap: Record<string, string> = {
    "1": "urgent",
    "2": "important",
    "3": "medium",
    "4": "low",
    "5": "low",
  };
  return priorityMap[priority] || "medium";
}

/**
 * Maps database priority to display format
 */
export function formatPriority(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Generates a temporary ID for client-side task management
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats ISO date string to readable format
 */
export function formatMeetingDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
