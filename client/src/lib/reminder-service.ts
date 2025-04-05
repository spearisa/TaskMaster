import { TaskWithStringDates } from '@shared/schema';
import { formatDate, getDaysUntilDeadline } from './utils/date-utils';

/**
 * ReminderService manages task reminders and deadline notifications
 */
export class ReminderService {
  private static instance: ReminderService;
  private registeredCallbacks: Map<string, (task: TaskWithStringDates) => void>;
  private permissionGranted: boolean = false;

  private constructor() {
    this.registeredCallbacks = new Map();
    this.checkNotificationPermission();
  }

  /**
   * Get the singleton instance of ReminderService
   */
  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * Request permission for browser notifications
   */
  public async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === "granted";
      return this.permissionGranted;
    }

    return false;
  }

  /**
   * Check if notification permission is granted
   */
  private checkNotificationPermission() {
    if ("Notification" in window) {
      this.permissionGranted = Notification.permission === "granted";
    }
  }

  /**
   * Register a callback to execute when a task notification is clicked
   */
  public registerCallback(key: string, callback: (task: TaskWithStringDates) => void) {
    this.registeredCallbacks.set(key, callback);
  }

  /**
   * Unregister a callback
   */
  public unregisterCallback(key: string) {
    this.registeredCallbacks.delete(key);
  }

  /**
   * Schedule a reminder for a task
   */
  public scheduleReminder(task: TaskWithStringDates, minutesBefore: number = 60): void {
    if (!task.dueDate || task.completed) return;

    const dueDate = new Date(task.dueDate);
    const reminderTime = new Date(dueDate.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();

    if (reminderTime <= now) {
      // If the reminder time is in the past, don't schedule it
      return;
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    // Schedule the reminder notification
    setTimeout(() => {
      this.showReminderNotification(task);
    }, timeUntilReminder);
  }

  /**
   * Show a reminder notification
   */
  private showReminderNotification(task: TaskWithStringDates): void {
    if (!this.permissionGranted) {
      this.requestPermission().then(granted => {
        if (granted) {
          this.displayNotification(task);
        }
      });
      return;
    }

    this.displayNotification(task);
  }

  /**
   * Display a browser notification for a task
   */
  private displayNotification(task: TaskWithStringDates): void {
    if (!("Notification" in window) || !this.permissionGranted) return;

    const daysLeft = task.dueDate ? getDaysUntilDeadline(task.dueDate) : null;
    const dueText = daysLeft === 0
      ? "due today"
      : daysLeft === 1
        ? "due tomorrow"
        : daysLeft !== null
          ? `due in ${daysLeft} days`
          : "due soon";

    const notificationTitle = `Task Reminder: ${task.title}`;
    const notificationOptions = {
      body: `This task is ${dueText}. Priority: ${task.priority}`,
      icon: '/notification-icon.png', // You can add an icon for notifications
      tag: `task-${task.id}`,
    };

    const notification = new Notification(notificationTitle, notificationOptions);

    notification.onclick = () => {
      window.focus();
      const callback = this.registeredCallbacks.get('taskClick');
      if (callback) {
        callback(task);
      }
    };
  }

  /**
   * Process all tasks and schedule reminders for upcoming deadlines
   */
  public processTasks(tasks: TaskWithStringDates[]): void {
    if (!tasks || tasks.length === 0) return;

    const upcomingTasks = tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) > new Date()
    );

    // Schedule reminders for each upcoming task
    upcomingTasks.forEach(task => {
      if (task.dueDate) {
        const daysUntil = getDaysUntilDeadline(task.dueDate);
        
        // Schedule different reminders based on urgency
        if (daysUntil !== null) {
          if (daysUntil <= 1) { 
            // For tasks due today or tomorrow, remind 1 hour before
            this.scheduleReminder(task, 60);
          } else if (daysUntil <= 3) {
            // For tasks due within 3 days, remind 1 day before
            this.scheduleReminder(task, 24 * 60);
          } else {
            // For tasks due later, remind 2 days before
            this.scheduleReminder(task, 2 * 24 * 60);
          }
        }
      }
    });
  }

  /**
   * Check for tasks that are due soon and show deadline warnings
   * Returns tasks that need attention (due today or tomorrow)
   */
  public checkDeadlines(tasks: TaskWithStringDates[]): TaskWithStringDates[] {
    if (!tasks || tasks.length === 0) return [];

    const now = new Date();
    const urgentTasks = tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      
      const daysUntil = getDaysUntilDeadline(task.dueDate);
      return daysUntil !== null && daysUntil <= 2; // Due today, tomorrow or day after
    });

    return urgentTasks;
  }

  /**
   * Show an immediate notification for a task that's due very soon
   */
  public showUrgentDeadlineNotification(task: TaskWithStringDates): void {
    if (!this.permissionGranted) {
      this.requestPermission().then(granted => {
        if (granted) {
          this.displayUrgentNotification(task);
        }
      });
      return;
    }

    this.displayUrgentNotification(task);
  }

  /**
   * Display an urgent notification for a task with imminent deadline
   */
  private displayUrgentNotification(task: TaskWithStringDates): void {
    if (!("Notification" in window) || !this.permissionGranted) return;

    const daysLeft = task.dueDate ? getDaysUntilDeadline(task.dueDate) : null;
    let urgencyText = "";
    
    if (daysLeft === 0) {
      urgencyText = "DUE TODAY! This task must be completed today.";
    } else if (daysLeft === 1) {
      urgencyText = "DUE TOMORROW! This task is due tomorrow.";
    } else if (daysLeft === 2) {
      urgencyText = "DUE SOON! This task is due in 2 days.";
    } else {
      urgencyText = "DEADLINE APPROACHING! Don't forget this task.";
    }

    const notificationTitle = `URGENT: ${task.title}`;
    const notificationOptions = {
      body: urgencyText,
      icon: '/notification-urgent-icon.png',
      tag: `task-urgent-${task.id}`,
      requireInteraction: true, // Notification won't auto-dismiss
      vibrate: [100, 50, 100], // Vibration pattern for mobile
    };

    const notification = new Notification(notificationTitle, notificationOptions);

    notification.onclick = () => {
      window.focus();
      const callback = this.registeredCallbacks.get('urgentTaskClick');
      if (callback) {
        callback(task);
      }
    };
  }
}

// Export a singleton instance
export const reminderService = ReminderService.getInstance();