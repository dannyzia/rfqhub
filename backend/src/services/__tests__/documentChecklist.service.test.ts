// backend/src/services/__tests__/documentChecklist.service.test.ts
// Skills: surgical_execution + architecture_respect

jest.mock("../../config/database", () => {
  const pool = { query: jest.fn() };
  return { __esModule: true, default: pool, pool };
});
jest.mock("../tenderTypeSelector.service");

import { documentChecklistService } from "../documentChecklist.service";
import { getTenderTypeByCode } from "../tenderTypeSelector.service";

describe("DocumentChecklistService", () => {
  const mockDb = require("../../config/database");

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.default.query.mockReset();
    mockDb.pool.query.mockReset();

    // Wire up tender type mock
    (getTenderTypeByCode as jest.Mock).mockResolvedValue({
      code: "PG2",
      name: "Procurement Group 2",
      min_value_bdt: 800000,
      max_value_bdt: 5000000,
      procurement_type: "government",
      is_active: true,
    });
  });

  describe("getDocumentRequirements", () => {
    it("should return document requirements for valid tender type", async () => {
      const mockRequirements = [
        {
          id: "req-001",
          tender_type_code: "PG2",
          document_code: "CO_REG",
          document_name: "Company Registration",
          category: "registration",
          is_mandatory: true,
          description: "Valid company registration certificate",
          file_format_allowed: ["pdf", "jpg"],
          max_file_size_mb: 5,
          instruction: "Must be valid for at least 1 year",
        },
        {
          id: "req-002",
          tender_type_code: "PG2",
          document_code: "TAX_CLR",
          document_name: "Tax Clearance",
          category: "financial",
          is_mandatory: true,
          description: "Tax clearance certificate",
          file_format_allowed: ["pdf"],
          max_file_size_mb: 3,
        },
      ];

      mockDb.default.query.mockResolvedValue({
        rows: mockRequirements,
        rowCount: 2,
      });

      const result =
        await documentChecklistService.getDocumentRequirements("PG2");

      expect(result).toEqual(mockRequirements);
      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining("tender_type_document_requirements"),
        ["PG2"],
      );
      expect(getTenderTypeByCode).toHaveBeenCalledWith("PG2");
    });
  });

  describe("getTenderChecklist", () => {
    it("should return checklist status for tender", async () => {
      const mockTender = { tender_type: "PG2" };
      const mockRequirements = [
        {
          id: "req-001",
          tender_type_code: "PG2",
          document_code: "CO_REG",
          document_name: "Company Registration",
          category: "registration",
          is_mandatory: true,
          description: "Valid company registration certificate",
        },
        {
          id: "req-002",
          tender_type_code: "PG2",
          document_code: "TAX_CLR",
          document_name: "Tax Clearance",
          category: "financial",
          is_mandatory: true,
          description: "Tax clearance certificate",
        },
      ];
      const mockSubmissions = [
        {
          id: "sub-001",
          tender_id: "tender-001",
          vendor_org_id: "vendor-001",
          document_requirement_id: "req-001",
          filename: "company_reg.pdf",
          file_path: "/files/company_reg.pdf",
          file_size: 1024000,
          mime_type: "application/pdf",
          uploaded_at: new Date().toISOString(),
          uploaded_by: "user-001",
          verified_at: new Date().toISOString(),
          is_verified: true,
          verified_by: "admin-001",
          document_name: "Company Registration",
        },
      ];

      mockDb.default.query
        .mockResolvedValueOnce({ rows: [mockTender], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockRequirements, rowCount: 2 })
        .mockResolvedValueOnce({ rows: mockSubmissions, rowCount: 1 });

      const result = await documentChecklistService.getTenderChecklist(
        "tender-001",
        "vendor-001",
      );

      expect(result).toBeDefined();
      expect(result.tenderTypeCode).toBe("PG2");
      expect(result.totalRequired).toBe(2);
      expect(result.mandatoryRequired).toBe(2);
      expect(result.submitted).toBe(1);
      expect(result.approved).toBe(1);
      expect(result.pending).toBe(0);
      expect(result.completionPercentage).toBe(50);
      expect(result.details).toHaveLength(2);
    });

    it("should throw error for non-existent tender", async () => {
      mockDb.default.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        documentChecklistService.getTenderChecklist("tender-999", "vendor-001"),
      ).rejects.toThrow("Tender not found");
    });

    it("should throw error when tender type not set", async () => {
      mockDb.default.query.mockResolvedValue({
        rows: [{ tender_type: null }],
        rowCount: 1,
      });

      await expect(
        documentChecklistService.getTenderChecklist("tender-001", "vendor-001"),
      ).rejects.toThrow("Tender type not set");
    });
  });

  describe("recordDocumentSubmission", () => {
    it("should record new document submission", async () => {
      const mockSubmission = {
        id: "sub-001",
        tender_id: "tender-001",
        vendor_org_id: "vendor-001",
        document_requirement_id: "req-001",
        filename: "company_reg.pdf",
        file_path: "/files/company_reg.pdf",
        file_size: 1024000,
        mime_type: "application/pdf",
        uploaded_by: "user-001",
        is_verified: false,
      };

      mockDb.default.query.mockResolvedValue({
        rows: [mockSubmission],
        rowCount: 1,
      });

      const result = await documentChecklistService.recordDocumentSubmission(
        "tender-001",
        "vendor-001",
        "req-001",
        "company_reg.pdf",
        "/files/company_reg.pdf",
        1024000,
        "application/pdf",
        "user-001",
      );

      expect(result).toEqual(mockSubmission);
      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tender_document_submissions"),
        [
          "tender-001",
          "vendor-001",
          "req-001",
          "company_reg.pdf",
          "/files/company_reg.pdf",
          1024000,
          "application/pdf",
          "user-001",
        ],
      );
    });

    it("should update existing submission on conflict", async () => {
      const mockSubmission = {
        id: "sub-001",
        tender_id: "tender-001",
        vendor_org_id: "vendor-001",
        document_requirement_id: "req-001",
        filename: "company_reg_v2.pdf",
        file_path: "/files/company_reg_v2.pdf",
        file_size: 2048000,
        mime_type: "application/pdf",
        uploaded_by: "user-001",
        is_verified: false,
      };

      mockDb.default.query.mockResolvedValue({
        rows: [mockSubmission],
        rowCount: 1,
      });

      const result = await documentChecklistService.recordDocumentSubmission(
        "tender-001",
        "vendor-001",
        "req-001",
        "company_reg_v2.pdf",
        "/files/company_reg_v2.pdf",
        2048000,
        "application/pdf",
        "user-001",
      );

      expect(result).toEqual(mockSubmission);
      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT"),
        expect.any(Array),
      );
    });
  });

  describe("verifyDocument", () => {
    it("should verify document as approved", async () => {
      const mockSubmission = {
        id: "sub-001",
        tender_id: "tender-001",
        vendor_org_id: "vendor-001",
        verification_status: "approved",
        verification_notes: "Document verified successfully",
        verified_at: new Date(),
      };

      mockDb.default.query.mockResolvedValue({
        rows: [mockSubmission],
        rowCount: 1,
      });

      const result = await documentChecklistService.verifyDocument(
        "sub-001",
        "approved",
        "Document verified successfully",
      );

      expect(result).toEqual(mockSubmission);
      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tender_document_submissions"),
        ["approved", "Document verified successfully", "sub-001"],
      );
    });

    it("should verify document as rejected with notes", async () => {
      const mockSubmission = {
        id: "sub-001",
        tender_id: "tender-001",
        vendor_org_id: "vendor-001",
        verification_status: "rejected",
        verification_notes: "Document expired",
        verified_at: new Date(),
      };

      mockDb.default.query.mockResolvedValue({
        rows: [mockSubmission],
        rowCount: 1,
      });

      const result = await documentChecklistService.verifyDocument(
        "sub-001",
        "rejected",
        "Document expired",
      );

      expect(result).toEqual(mockSubmission);
    });

    it("should throw error for non-existent submission", async () => {
      mockDb.default.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        documentChecklistService.verifyDocument("sub-999", "approved"),
      ).rejects.toThrow("Submission not found");
    });
  });

  describe("getMissingMandatoryDocuments", () => {
    it("should return missing mandatory documents", async () => {
      const mockRequirements = [
        {
          id: "req-001",
          tender_type_code: "PG2",
          document_code: "CO_REG",
          document_name: "Company Registration",
          category: "registration",
          is_mandatory: true,
          description: "Valid company registration certificate",
        },
        {
          id: "req-002",
          tender_type_code: "PG2",
          document_code: "TAX_CLR",
          document_name: "Tax Clearance",
          category: "financial",
          is_mandatory: true,
          description: "Tax clearance certificate",
        },
        {
          id: "req-003",
          tender_type_code: "PG2",
          document_code: "FIN_STMT",
          document_name: "Financial Statement",
          category: "financial",
          is_mandatory: false,
          description: "Financial statement (optional)",
        },
      ];

      // SQL filters for mandatory docs - mock returns only what SQL would return
      const mandatoryRequirements = mockRequirements.filter(r => r.is_mandatory);
      mockDb.default.query.mockResolvedValue({
        rows: mandatoryRequirements,
        rowCount: mandatoryRequirements.length,
      });

      const result =
        await documentChecklistService.getMissingMandatoryDocuments(
          "tender-001",
          "vendor-001",
        );

      expect(result).toHaveLength(2);
      expect(result.every((req) => req.is_mandatory)).toBe(true);
      expect(mockDb.default.query).toHaveBeenCalledWith(
        expect.stringContaining("tender_type_document_requirements dr"),
        expect.any(Array),
      );
    });

    it("should only include mandatory documents", async () => {
      // SQL filters for mandatory docs - mock only returns mandatory items
      const mandatoryOnly = [
        {
          id: "req-001",
          tender_type_code: "PG2",
          document_code: "CO_REG",
          document_name: "Company Registration",
          category: "registration",
          is_mandatory: true,
          description: "Valid company registration certificate",
        },
      ];

      mockDb.default.query.mockResolvedValue({
        rows: mandatoryOnly,
        rowCount: 1,
      });

      const result =
        await documentChecklistService.getMissingMandatoryDocuments(
          "tender-001",
          "vendor-001",
        );

      expect(result).toHaveLength(1);
      expect(result[0].document_name).toBe("Company Registration");
      expect(result[0].is_mandatory).toBe(true);
    });
  });

  describe("formatChecklistDisplay", () => {
    it("should be defined as a property", () => {
      expect(documentChecklistService.formatChecklistDisplay).toBeDefined();
      expect(typeof documentChecklistService.formatChecklistDisplay).toBe(
        "function",
      );
    });
  });
});
