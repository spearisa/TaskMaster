import { format, formatDistance, differenceInDays, isToday, isTomorrow, isYesterday, addDays } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @param formatStr Optional format string (defaults to 'PPP')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | undefined, formatStr: string = 'PPP'): string {
  if (!dateString) return 'No date set';
  
  try {
    const date = new Date(dateString);
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date string to a time format
 * @param dateString ISO date string
 * @returns Formatted time string
 */
export function formatTime(dateString: string | undefined): string {
  if (!dateString) return 'No time set';
  
  try {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Format a date as a relative date (e.g., "today", "yesterday", "in 2 days", "2 days ago")
 * @param dateString ISO date string
 * @returns Formatted relative date string
 */
export function formatRelativeDate(dateString: string | undefined): string {
  if (!dateString) return 'No date set';
  
  try {
    const date = new Date(dateString);
    
    // Check for common relative dates
    if (isToday(date)) {
      return 'Due today';
    }
    
    if (isTomorrow(date)) {
      return 'Due tomorrow';
    }
    
    if (isYesterday(date)) {
      return 'Due yesterday (overdue)';
    }
    
    // Use format distance for other dates
    return `Due ${formatDistance(date, new Date(), { addSuffix: true })}`;
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Invalid date';
  }
}

/**
 * Calculate days until the deadline
 * @param dateString ISO date string
 * @returns Number of days until the deadline (positive if in the future, negative if in the past)
 */
export function getDaysUntilDeadline(dateString: string | undefined): number | null {
  if (!dateString) return null;
  
  try {
    const dueDate = new Date(dateString);
    const today = new Date();
    
    // Reset time parts to get accurate day differences
    today.setHours(0, 0, 0, 0);
    const dueDateWithoutTime = new Date(dueDate);
    dueDateWithoutTime.setHours(0, 0, 0, 0);
    
    return differenceInDays(dueDateWithoutTime, today);
  } catch (error) {
    console.error('Error calculating days until deadline:', error);
    return null;
  }
}

/**
 * Get a descriptive string based on due date urgency
 * @param dateString ISO date string
 * @returns String describing the urgency
 */
export function getUrgencyString(dateString: string | undefined): string {
  if (!dateString) return 'No deadline';
  
  const daysUntil = getDaysUntilDeadline(dateString);
  
  if (daysUntil === null) return 'Unknown deadline';
  
  if (daysUntil < 0) {
    return `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`;
  }
  
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  
  return `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
}

/**
 * Get CSS class for urgency styling
 * @param dateString ISO date string
 * @returns CSS class name for styling
 */
export function getUrgencyClass(dateString: string | undefined): string {
  if (!dateString) return 'text-gray-500';
  
  const daysUntil = getDaysUntilDeadline(dateString);
  
  if (daysUntil === null) return 'text-gray-500';
  
  if (daysUntil < 0) return 'text-red-500';  // Overdue
  if (daysUntil === 0) return 'text-red-500'; // Due today
  if (daysUntil === 1) return 'text-orange-500'; // Due tomorrow
  if (daysUntil <= 3) return 'text-amber-500'; // Due soon
  
  return 'text-green-500'; // Due in more than 3 days
}

/**
 * Generate dates for the next 7 days
 * @returns Array of dates for the next 7 days
 */
export function getNext7Days(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(today, i));
  }
  
  return dates;
}

/**
 * Check if a date is past (before today)
 * @param dateString ISO date string
 * @returns Boolean indicating if the date is in the past
 */
export function isPastDate(dateString: string | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    return date < today;
  } catch (error) {
    console.error('Error checking if date is past:', error);
    return false;
  }
}