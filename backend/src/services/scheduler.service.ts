import { logger } from "../config";
import { currencyService } from "./currency.service";
import { notificationService } from "./notification.service";

interface ScheduledTask {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  lastRun?: Date;
  isRunning: boolean;
}

const tasks: ScheduledTask[] = [];
const intervals: NodeJS.Timeout[] = [];

export const schedulerService = {
  registerTask(
    name: string,
    intervalMs: number,
    handler: () => Promise<void>,
  ): void {
    tasks.push({
      name,
      intervalMs,
      handler,
      isRunning: false,
    });
    logger.info("Scheduled task registered", { taskName: name, intervalMs });
  },

  async runTask(task: ScheduledTask): Promise<void> {
    if (task.isRunning) {
      logger.warn("Task already running, skipping", { taskName: task.name });
      return;
    }

    task.isRunning = true;
    const startTime = Date.now();

    try {
      await task.handler();
      task.lastRun = new Date();

      const duration = Date.now() - startTime;
      logger.info("Scheduled task completed", {
        taskName: task.name,
        duration,
      });
    } catch (error) {
      logger.error("Scheduled task failed", { taskName: task.name, error });
    } finally {
      task.isRunning = false;
    }
  },

  startAll(): void {
    for (const task of tasks) {
      const interval = setInterval(() => {
        this.runTask(task);
      }, task.intervalMs);

      intervals.push(interval);

      // Run immediately on start
      this.runTask(task);
    }

    logger.info("Scheduler started", { taskCount: tasks.length });
  },

  stopAll(): void {
    for (const interval of intervals) {
      clearInterval(interval);
    }
    intervals.length = 0;
    logger.info("Scheduler stopped");
  },

  getTaskStatus(): Array<{
    name: string;
    lastRun: Date | undefined;
    isRunning: boolean;
  }> {
    return tasks.map((task) => ({
      name: task.name,
      lastRun: task.lastRun,
      isRunning: task.isRunning,
    }));
  },
};

// Register default tasks
export const initializeScheduledTasks = (): void => {
  // Refresh currency rates daily (every 24 hours)
  schedulerService.registerTask(
    "refresh-currency-rates",
    24 * 60 * 60 * 1000, // 24 hours
    async () => {
      await currencyService.fetchAndCacheRates();
    },
  );

  // Process pending notifications (every 30 seconds)
  schedulerService.registerTask(
    "process-notifications",
    30 * 1000, // 30 seconds
    async () => {
      await notificationService.processPendingNotifications();
    },
  );

  // Check deadline reminders (every hour)
  // TODO: Implement sendDeadlineReminders in notification service
  // schedulerService.registerTask(
  //   "deadline-reminders",
  //   60 * 60 * 1000, // 1 hour
  //   async () => {
  //     await notificationService.sendDeadlineReminders();
  //   },
  // );

  // Check vendor document expiry (daily)
  // TODO: Implement sendDocumentExpiryReminders in notification service
  // schedulerService.registerTask(
  //   "vendor-doc-expiry",
  //   24 * 60 * 60 * 1000, // 24 hours
  //   async () => {
  //     await notificationService.sendDocumentExpiryReminders();
  //   },
  // );

  // Check unacknowledged addenda (every 6 hours)
  // TODO: Implement sendUnacknowledgedAddendaReminders in notification service
  // schedulerService.registerTask(
  //   "unacknowledged-addenda",
  //   6 * 60 * 60 * 1000, // 6 hours
  //   async () => {
  //     await notificationService.sendUnacknowledgedAddendaReminders();
  //   },
  // );

  logger.info("Scheduled tasks initialized");
};
