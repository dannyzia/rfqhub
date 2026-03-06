// backend/src/services/__tests__/scheduler.service.test.ts
// Skills: surgical_execution + architecture_respect
//
// Tests exercise the actual in-memory scheduler API:
//   registerTask, runTask, startAll, stopAll, getTaskStatus
//
// Strategy: mock all side-effect dependencies at the top level (hoisted),
// then reset the module-level tasks/intervals arrays before each test by
// accessing them through the `(schedulerService as any)` cast.

// ── Hoisted mocks (must be before any imports) ─────────────────────────────
jest.mock("../../config/database");
jest.mock("../../config", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  pool: { query: jest.fn() },
  config: {},
}));
jest.mock("../currency.service", () => ({
  currencyService: {
    fetchAndCacheRates: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock("../notification.service", () => ({
  notificationService: {
    processPendingNotifications: jest.fn().mockResolvedValue(undefined),
  },
}));

import { schedulerService } from "../scheduler.service";

// Grab the mocked logger so we can assert on it in tests.
// After Jest's resetMocks: true runs, the jest.fn() instances are still the
// same objects (just with cleared call history / removed implementations).
const { logger: mockLogger } = require("../../config");

describe("SchedulerService", () => {
  /**
   * Reset module-level state before each test.
   * Uses the test-only __resetForTests() helper to clear the internal
   * tasks and intervals arrays, ensuring each test starts with a clean slate.
   * This avoids jest.resetModules() which conflicts with resetMocks: true.
   */
  beforeEach(() => {
    (schedulerService as any).__resetForTests();
    jest.useRealTimers();
  });

  afterEach(() => {
    schedulerService.stopAll();
    jest.useRealTimers();
  });

  // ── registerTask ──────────────────────────────────────────────────────────

  describe("registerTask", () => {
    it("should register a task and make it visible in getTaskStatus", () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      schedulerService.registerTask("email-digest", 60_000, handler);

      const status = schedulerService.getTaskStatus();
      expect(status).toHaveLength(1);
      expect(status[0].name).toBe("email-digest");
      expect(status[0].isRunning).toBe(false);
      expect(status[0].lastRun).toBeUndefined();
    });

    it("should register multiple tasks independently", () => {
      schedulerService.registerTask(
        "task-alpha",
        1_000,
        jest.fn().mockResolvedValue(undefined),
      );
      schedulerService.registerTask(
        "task-beta",
        2_000,
        jest.fn().mockResolvedValue(undefined),
      );
      schedulerService.registerTask(
        "task-gamma",
        3_000,
        jest.fn().mockResolvedValue(undefined),
      );

      const status = schedulerService.getTaskStatus();
      expect(status).toHaveLength(3);
      expect(status.map((s: any) => s.name)).toEqual([
        "task-alpha",
        "task-beta",
        "task-gamma",
      ]);
    });

    it("should log task registration with name and intervalMs", () => {
      // Re-attach a mock implementation since resetMocks: true cleared it
      (mockLogger.info as jest.Mock).mockImplementation(() => undefined);

      schedulerService.registerTask(
        "log-test-task",
        5_000,
        jest.fn().mockResolvedValue(undefined),
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Scheduled task registered",
        expect.objectContaining({
          taskName: "log-test-task",
          intervalMs: 5_000,
        }),
      );
    });
  });

  // ── runTask ───────────────────────────────────────────────────────────────

  describe("runTask", () => {
    it("should invoke the handler and set lastRun on success", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const task: any = {
        name: "run-success",
        intervalMs: 1_000,
        handler,
        isRunning: false,
      };

      await schedulerService.runTask(task);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(task.lastRun).toBeInstanceOf(Date);
      expect(task.isRunning).toBe(false); // reset after completion
    });

    it("should skip execution and warn when task is already running", async () => {
      (mockLogger.warn as jest.Mock).mockImplementation(() => undefined);
      const handler = jest.fn().mockResolvedValue(undefined);
      const task: any = {
        name: "already-running",
        intervalMs: 1_000,
        handler,
        isRunning: true, // already running
      };

      await schedulerService.runTask(task);

      expect(handler).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Task already running, skipping",
        expect.objectContaining({ taskName: "already-running" }),
      );
    });

    it("should catch handler errors without re-throwing", async () => {
      (mockLogger.error as jest.Mock).mockImplementation(() => undefined);
      const boom = new Error("handler exploded");
      const handler = jest.fn().mockRejectedValue(boom);
      const task: any = {
        name: "error-task",
        intervalMs: 1_000,
        handler,
        isRunning: false,
      };

      // Should NOT reject
      await expect(schedulerService.runTask(task)).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Scheduled task failed",
        expect.objectContaining({ taskName: "error-task", error: boom }),
      );
    });

    it("should reset isRunning to false even when handler throws", async () => {
      (mockLogger.error as jest.Mock).mockImplementation(() => undefined);
      const handler = jest.fn().mockRejectedValue(new Error("fail"));
      const task: any = {
        name: "reset-on-fail",
        intervalMs: 1_000,
        handler,
        isRunning: false,
      };

      await schedulerService.runTask(task);

      expect(task.isRunning).toBe(false);
    });

    it("should log completion with duration on success", async () => {
      (mockLogger.info as jest.Mock).mockImplementation(() => undefined);
      const handler = jest.fn().mockResolvedValue(undefined);
      const task: any = {
        name: "duration-task",
        intervalMs: 1_000,
        handler,
        isRunning: false,
      };

      await schedulerService.runTask(task);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Scheduled task completed",
        expect.objectContaining({
          taskName: "duration-task",
          duration: expect.any(Number),
        }),
      );
    });
  });

  // ── startAll / stopAll ────────────────────────────────────────────────────

  describe("startAll", () => {
    it("should immediately execute all registered tasks on start", async () => {
      jest.useFakeTimers();
      const handler = jest.fn().mockResolvedValue(undefined);
      schedulerService.registerTask("immediate-task", 60_000, handler);

      schedulerService.startAll();

      // Flush the microtask queue so the async runTask promise resolves
      await Promise.resolve();
      await Promise.resolve();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should execute tasks again after their interval elapses", async () => {
      jest.useFakeTimers();
      const handler = jest.fn().mockResolvedValue(undefined);
      schedulerService.registerTask("interval-task", 1_000, handler);

      schedulerService.startAll();
      // Flush immediate call
      await Promise.resolve();
      await Promise.resolve();

      // Advance past one interval
      jest.advanceTimersByTime(1_000);
      await Promise.resolve();
      await Promise.resolve();

      // Called once immediately + once via setInterval
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should log task count on start", () => {
      (mockLogger.info as jest.Mock).mockImplementation(() => undefined);
      schedulerService.registerTask(
        "t1",
        1_000,
        jest.fn().mockResolvedValue(undefined),
      );
      schedulerService.registerTask(
        "t2",
        2_000,
        jest.fn().mockResolvedValue(undefined),
      );

      schedulerService.startAll();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Scheduler started",
        expect.objectContaining({ taskCount: 2 }),
      );
    });
  });

  describe("stopAll", () => {
    it("should clear all intervals so tasks no longer fire after stop", async () => {
      jest.useFakeTimers();
      const handler = jest.fn().mockResolvedValue(undefined);
      schedulerService.registerTask("stop-test-task", 1_000, handler);

      schedulerService.startAll();
      await Promise.resolve();
      await Promise.resolve();

      const callsAfterStart = handler.mock.calls.length;

      schedulerService.stopAll();
      jest.advanceTimersByTime(5_000); // well past the 1s interval

      // No additional calls after stopAll
      expect(handler.mock.calls.length).toBe(callsAfterStart);
    });

    it("should log on stop", () => {
      (mockLogger.info as jest.Mock).mockImplementation(() => undefined);

      schedulerService.stopAll();

      expect(mockLogger.info).toHaveBeenCalledWith("Scheduler stopped");
    });
  });

  // ── getTaskStatus ─────────────────────────────────────────────────────────

  describe("getTaskStatus", () => {
    it("should return empty array when no tasks are registered", () => {
      const status = schedulerService.getTaskStatus();
      expect(status).toEqual([]);
    });

    it("should return correct status shape for registered tasks", () => {
      schedulerService.registerTask(
        "status-task",
        5_000,
        jest.fn().mockResolvedValue(undefined),
      );

      const [task] = schedulerService.getTaskStatus();

      expect(task).toMatchObject({
        name: "status-task",
        isRunning: false,
        lastRun: undefined,
      });
    });

    it("should reflect lastRun after task has been run manually", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      schedulerService.registerTask("reflect-lastrun", 1_000, handler);

      // Use the test-only helper to retrieve the task object
      const internalTask = (schedulerService as any).__getTaskForTests("reflect-lastrun");
      await schedulerService.runTask(internalTask);

      const [status] = schedulerService.getTaskStatus();
      expect(status.name).toBe("reflect-lastrun");
      expect(status.lastRun).toBeInstanceOf(Date);
    });
  });
});
