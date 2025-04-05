import { format, differenceInDays, differenceInHours, isValid, parseISO } from 'date-fns';

/**
 * Format a date string in a human-readable format
 * @param dateString ISO date string, null, or undefined
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No date';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid date';
  }
}

/**
 * Format a date string as a relative time (today, tomorrow, in X days)
 * @param dateString ISO date string, null, or undefined
 */
export function formatRelativeDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No deadline';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const daysDiff = differenceInDays(dueDate, today);
    
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff > 1) return `In ${daysDiff} days`;
    if (daysDiff === -1) return 'Yesterday';
    return `${Math.abs(daysDiff)} days ago`;
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return 'Invalid date';
  }
}

/**
 * Get days remaining until a deadline
 * @param dateString ISO date string, null, or undefined
 * @returns Number of days until deadline or null if invalid date
 */
export function getDaysUntilDeadline(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return null;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return differenceInDays(dueDate, today);
  } catch (error) {
    console.error("Error calculating days until deadline:", error);
    return null;
  }
}

/**
 * Check if a date is today
 * @param dateString ISO date string, null, or undefined
 */
export function isToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return false;
    
    const now = new Date();
    
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  } catch (error) {
    console.error("Error checking if date is today:", error);
    return false;
  }
}

/**
 * Check if a date is tomorrow
 * @param dateString ISO date string, null, or undefined
 */
export function isTomorrow(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return false;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  } catch (error) {
    console.error("Error checking if date is tomorrow:", error);
    return false;
  }
}

/**
 * Format hours until deadline
 * @param dateString ISO date string, null, or undefined
 */
export function getHoursUntilDeadline(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return null;
    
    const now = new Date();
    
    return Math.max(0, differenceInHours(date, now));
  } catch (error) {
    console.error("Error calculating hours until deadline:", error);
    return null;
  }
}