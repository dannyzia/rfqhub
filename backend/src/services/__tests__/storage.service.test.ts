// backend/src/services/__tests__/storage.service.test.ts
// Skills: surgical_execution + architecture_respect

jest.mock("../../config/database", () => {
  const pool = { query: jest.fn(), connect: jest.fn() };
  return { __esModule: true, default: pool, pool };
});

import { StorageService } from "../storage.service";
import { storageService } from "../storage.service";

describe("StorageService", () => {
  const mockDb = require("../../config/database");

  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.default.query.mockReset();
    mockDb.pool.query.mockReset();
    mockDb.pool.connect.mockReset();

    // Transaction client mock
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
  });

  describe("getStorageUsage", () => {
    it("should return storage usage for organization", async () => {
      const mockUsage = {
        organization_id: "org-001",
        used_bytes: 1048576,
        last_calculated_at: new Date().toISOString(),
      };

      mockDb.default.query.mockResolvedValue({
        rows: [mockUsage],
        rowCount: 1,
      });

      const result = await StorageService.getStorageUsage("org-001");

      expect(result).toEqual(mockUsage);
      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining("organization_storage_usage"),
        ["org-001"],
      );
    });

    it("should initialize storage usage for new organization", async () => {
      mockDb.default.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await StorageService.getStorageUsage("new-org");

      expect(result.organization_id).toBe("new-org");
      expect(result.used_bytes).toBe(0);
      expect(mockDb.default.query).toHaveBeenCalledTimes(2);
    });
  });

  describe("checkAndRecordUpload", () => {
    it("should allow upload when within quota", async () => {
      const mockStorage = {
        organization_id: "org-001",
        used_bytes: 1048576,
        last_calculated_at: new Date().toISOString(),
      };

      const mockSubscription = {
        organization_id: "org-001",
        storage_limit_bytes: 10485760,
        custom_storage_bytes: null,
      };

      const mockFileUpload = {
        id: "file-001",
        organization_id: "org-001",
        original_name: "test.pdf",
        stored_key: "files/test.pdf",
        file_size_bytes: 1024000,
        mime_type: "application/pdf",
      };

      mockDb.pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [mockStorage], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockSubscription], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockFileUpload], rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await StorageService.checkAndRecordUpload(
        "org-001",
        "tender-001",
        "user-001",
        "test.pdf",
        "files/test.pdf",
        "application/pdf",
        1024000,
      );

      expect(result.allowed).toBe(true);
      expect(result.fileUpload).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should reject upload when exceeding quota", async () => {
      const mockStorage = {
        organization_id: "org-001",
        used_bytes: 10485760,
        last_calculated_at: new Date().toISOString(),
      };

      const mockSubscription = {
        organization_id: "org-001",
        storage_limit_bytes: 10485760,
        custom_storage_bytes: null,
      };

      mockDb.pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN (result ignored)
        .mockResolvedValueOnce({ rows: [mockStorage], rowCount: 1 }) // SELECT storage FOR UPDATE
        .mockResolvedValueOnce({ rows: [mockSubscription], rowCount: 1 }); // SELECT subscriptions → exceeds quota → ROLLBACK

      const result = await StorageService.checkAndRecordUpload(
        "org-001",
        "tender-001",
        "user-001",
        "test.pdf",
        "files/test.pdf",
        "application/pdf",
        1024000,
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Storage quota exceeded");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should reject upload when no active subscription", async () => {
      const mockStorage = {
        organization_id: "org-001",
        used_bytes: 0,
        last_calculated_at: new Date().toISOString(),
      };

      mockDb.pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({ rows: [mockStorage], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await StorageService.checkAndRecordUpload(
        "org-001",
        "tender-001",
        "user-001",
        "test.pdf",
        "files/test.pdf",
        "application/pdf",
        1024000,
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("No active subscription");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should reject upload when file size is zero", async () => {
      mockDb.pool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await StorageService.checkAndRecordUpload(
        "org-001",
        "tender-001",
        "user-001",
        "test.pdf",
        "files/test.pdf",
        "application/pdf",
        0,
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("File size must be greater than 0");
    });
  });

  describe("canUploadFile", () => {
    it("should return true when within quota", async () => {
      const mockUsage = { organization_id: "org-001", used_bytes: 1048576 };
      const mockSubscription = {
        organization_id: "org-001",
        storage_limit_bytes: 10485760,
        custom_storage_bytes: null,
      };

      mockDb.default.query
        .mockResolvedValueOnce({ rows: [mockUsage], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockSubscription], rowCount: 1 });

      const result = await StorageService.canUploadFile("org-001", 1024000);

      expect(result).toBe(true);
    });

    it("should return false when exceeding quota", async () => {
      const mockUsage = { organization_id: "org-001", used_bytes: 10485760 };
      const mockSubscription = {
        organization_id: "org-001",
        storage_limit_bytes: 10485760,
        custom_storage_bytes: null,
      };

      mockDb.default.query
        .mockResolvedValueOnce({ rows: [mockUsage], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockSubscription], rowCount: 1 });

      const result = await StorageService.canUploadFile("org-001", 1024000);

      expect(result).toBe(false);
    });

    it("should return true for unlimited storage", async () => {
      const mockUsage = { organization_id: "org-001", used_bytes: 10485760 };
      const mockSubscription = {
        organization_id: "org-001",
        storage_limit_bytes: null,
        custom_storage_bytes: null,
      };

      mockDb.default.query
        .mockResolvedValueOnce({ rows: [mockUsage], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockSubscription], rowCount: 1 });

      const result = await StorageService.canUploadFile("org-001", 1024000);

      expect(result).toBe(true);
    });

    it("should return false when no active subscription", async () => {
      const mockUsage = { organization_id: "org-001", used_bytes: 1048576 };

      mockDb.default.query
        .mockResolvedValueOnce({ rows: [mockUsage], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await StorageService.canUploadFile("org-001", 1024000);

      expect(result).toBe(false);
    });
  });

  describe("recordFileUpload", () => {
    it("should record file upload and update storage usage", async () => {
      const mockFileUpload = {
        id: "file-001",
        organization_id: "org-001",
        original_name: "test.pdf",
        stored_key: "files/test.pdf",
        file_size_bytes: 1024000,
      };

      mockDb.pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockFileUpload], rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await StorageService.recordFileUpload(
        "org-001",
        "tender-001",
        "user-001",
        "test.pdf",
        "files/test.pdf",
        "application/pdf",
        1024000,
      );

      expect(result).toEqual(mockFileUpload);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("deleteFileUpload", () => {
    it("should delete file and update storage usage", async () => {
      const mockFile = { id: "file-001", file_size_bytes: 1024000 };

      mockDb.pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN (result ignored)
        .mockResolvedValueOnce({ rows: [mockFile], rowCount: 1 }) // SELECT file info
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE file_uploads SET is_deleted = true
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE organization_storage_usage
      // COMMIT returns undefined by default (result ignored)

      await StorageService.deleteFileUpload("file-001", "org-001");

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("is_deleted = true"),
        ["file-001", "org-001"],
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should throw error when file not found", async () => {
      mockDb.pool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        StorageService.deleteFileUpload("file-999", "org-001"),
      ).rejects.toThrow("File not found or already deleted");
    });
  });

  describe("getOrganizationFiles", () => {
    it("should return files for organization", async () => {
      const mockFiles = [
        {
          id: "file-001",
          original_name: "test1.pdf",
          file_size_bytes: 1024000,
        },
        {
          id: "file-002",
          original_name: "test2.pdf",
          file_size_bytes: 2048000,
        },
      ];

      mockDb.default.query.mockResolvedValue({ rows: mockFiles, rowCount: 2 });

      const result = await StorageService.getOrganizationFiles("org-001");

      expect(result).toEqual(mockFiles);
      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "WHERE organization_id = $1 AND is_deleted = false",
        ),
        ["org-001", 50, 0],
      );
    });

    it("should filter by tender id when provided", async () => {
      mockDb.default.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await StorageService.getOrganizationFiles("org-001", "tender-001");

      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining("AND tender_id = $2"),
        ["org-001", "tender-001", 50, 0],
      );
    });
  });

  describe("getFileUpload", () => {
    it("should return file by id and organization", async () => {
      const mockFile = {
        id: "file-001",
        organization_id: "org-001",
        original_name: "test.pdf",
        file_size_bytes: 1024000,
      };

      mockDb.default.query.mockResolvedValue({ rows: [mockFile], rowCount: 1 });

      const result = await StorageService.getFileUpload("file-001", "org-001");

      expect(result).toEqual(mockFile);
    });

    it("should return null for non-existent file", async () => {
      mockDb.default.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await StorageService.getFileUpload("file-999", "org-001");

      expect(result).toBeNull();
    });
  });

  describe("recalculateStorageUsage", () => {
    it("should recalculate storage usage for organization", async () => {
      const mockTotal = { total_bytes: 5242880 };

      mockDb.default.query
        .mockResolvedValueOnce({ rows: [mockTotal], rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });

      await StorageService.recalculateStorageUsage("org-001");

      expect(mockDb.default.query).toHaveBeenCalledTimes(2);
      expect(mockDb.default.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("SELECT COALESCE(SUM(file_size_bytes), 0)"),
        ["org-001"],
      );
      expect(mockDb.default.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE organization_storage_usage"),
        expect.any(Array),
      );
    });
  });

  describe("storageService alias", () => {
    it("should export storageService as alias for StorageService", () => {
      expect(storageService).toBe(StorageService);
    });
  });
});
