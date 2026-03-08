// Setup all mocks BEFORE any other imports
jest.mock('../../config/database');
jest.mock('../../config/logger');
jest.mock('uuid');

// Create mock PDFDocument class
class MockPDFDocument {
  on = jest.fn().mockReturnThis();
  fontSize = jest.fn().mockReturnThis();
  text = jest.fn().mockReturnThis();
  moveDown = jest.fn().mockReturnThis();
  end = jest.fn().mockReturnThis();
}

jest.mock('pdfkit', () => {
  // Return the class constructor as default export
  return MockPDFDocument;
});

jest.mock('exceljs', () => {
  const mockAddRows = jest.fn();
  const mockWorksheet = {
    columns: undefined as unknown,
    addRows: mockAddRows,
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      addWorksheet: () => mockWorksheet,
    })),
  };
});

// Now import the services AFTER mocking
import { exportService } from '../export.service';
import type { RequestExportInput } from '../../schemas/export.schema';
import { v4 as uuidv4 } from 'uuid';

describe('ExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('export-uuid-1234');
  });

  describe('createExportJob', () => {
    it('should create export job for tender summary PDF', async () => {
      const mockDatabase = require('../../config/database');

      const mockJob = {
        id: 'export-uuid-1234',
        user_id: 'user-001',
        export_type: 'tender_summary',
        format: 'pdf',
        tender_id: 'tender-001',
        vendor_id: null,
        status: 'pending',
        file_url: null,
        error_message: null,
        created_at: new Date(),
        completed_at: null,
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [mockJob] });

      const input: RequestExportInput = {
        exportType: 'tender_summary',
        format: 'pdf',
        tenderId: 'tender-001',
      };

      const result = await exportService.createExportJob('user-001', input);

      expect(result.id).toBe('export-uuid-1234');
      expect(result.exportType).toBe('tender_summary');
      expect(result.format).toBe('pdf');
      expect(result.status).toBe('pending');
    });

    it('should create export job for bid comparison', async () => {
      const mockDatabase = require('../../config/database');

      const mockJob = {
        id: 'export-uuid-1234',
        user_id: 'user-001',
        export_type: 'bid_comparison',
        format: 'xlsx',
        tender_id: 'tender-001',
        vendor_id: null,
        status: 'pending',
        file_url: null,
        error_message: null,
        created_at: new Date(),
        completed_at: null,
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [mockJob] });

      const input: RequestExportInput = {
        exportType: 'bid_comparison',
        format: 'xlsx',
        tenderId: 'tender-001',
      };

      const result = await exportService.createExportJob('user-001', input);

      expect(result.exportType).toBe('bid_comparison');
      expect(result.format).toBe('xlsx');
    });

    it('should create export job with vendor filter', async () => {
      const mockDatabase = require('../../config/database');

      const mockJob = {
        id: 'export-uuid-1234',
        user_id: 'user-001',
        export_type: 'bid_integrity',
        format: 'pdf',
        tender_id: 'tender-001',
        vendor_id: 'vendor-001',
        status: 'pending',
        file_url: null,
        error_message: null,
        created_at: new Date(),
        completed_at: null,
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [mockJob] });

      const input: RequestExportInput = {
        exportType: 'bid_integrity',
        format: 'pdf',
        tenderId: 'tender-001',
        vendorId: 'vendor-001',
      };

      const result = await exportService.createExportJob('user-001', input);

      expect(result.vendorId).toBe('vendor-001');
    });

    it('should create export job for award letter', async () => {
      const mockDatabase = require('../../config/database');

      const mockJob = {
        id: 'export-uuid-1234',
        user_id: 'user-001',
        export_type: 'award_letter',
        format: 'pdf',
        tender_id: 'tender-001',
        vendor_id: null,
        status: 'pending',
        file_url: null,
        error_message: null,
        created_at: new Date(),
        completed_at: null,
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [mockJob] });

      const input: RequestExportInput = {
        exportType: 'award_letter',
        format: 'pdf',
        tenderId: 'tender-001',
      };

      const result = await exportService.createExportJob('user-001', input);

      expect(result.exportType).toBe('award_letter');
    });

    it('should create export job for full data dump', async () => {
      const mockDatabase = require('../../config/database');

      const mockJob = {
        id: 'export-uuid-1234',
        user_id: 'user-001',
        export_type: 'full_data_dump',
        format: 'xlsx',
        tender_id: 'tender-001',
        vendor_id: null,
        status: 'pending',
        file_url: null,
        error_message: null,
        created_at: new Date(),
        completed_at: null,
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [mockJob] });

      const input: RequestExportInput = {
        exportType: 'full_data_dump',
        format: 'xlsx',
        tenderId: 'tender-001',
      };

      const result = await exportService.createExportJob('user-001', input);

      expect(result.exportType).toBe('full_data_dump');
    });
  });

  describe('getJobById', () => {
    it('should return export job by id', async () => {
      const mockDatabase = require('../../config/database');

      const job = {
        id: 'export-001',
        user_id: 'user-001',
        export_type: 'tender_summary',
        format: 'pdf',
        tender_id: 'tender-001',
        vendor_id: null,
        status: 'completed',
        file_url: 'https://s3.example.com/export.pdf',
        error_message: null,
        created_at: new Date(),
        completed_at: new Date(),
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [job] });

      const result = await exportService.getJobById('export-001');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('completed');
      expect(result?.fileUrl).toBe('https://s3.example.com/export.pdf');
    });

    it('should return null if job not found', async () => {
      const mockDatabase = require('../../config/database');
      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await exportService.getJobById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listUserJobs', () => {
    it('should list user export jobs', async () => {
      const mockDatabase = require('../../config/database');

      const jobs = [
        {
          id: 'export-001',
          user_id: 'user-001',
          export_type: 'tender_summary',
          format: 'pdf',
          tender_id: 'tender-001',
          vendor_id: null,
          status: 'completed',
          file_url: 'https://s3.example.com/export1.pdf',
          error_message: null,
          created_at: new Date(),
          completed_at: new Date(),
        },
        {
          id: 'export-002',
          user_id: 'user-001',
          export_type: 'bid_comparison',
          format: 'xlsx',
          tender_id: 'tender-002',
          vendor_id: null,
          status: 'completed',
          file_url: 'https://s3.example.com/export2.xlsx',
          error_message: null,
          created_at: new Date(),
          completed_at: new Date(),
        },
      ];

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: jobs });

      const result = await exportService.listUserJobs('user-001', { limit: 10, offset: 0 });

      expect(result.jobs).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter jobs by status', async () => {
      const mockDatabase = require('../../config/database');

      const jobs = [
        {
          id: 'export-001',
          user_id: 'user-001',
          export_type: 'tender_summary',
          format: 'pdf',
          tender_id: 'tender-001',
          vendor_id: null,
          status: 'pending',
          file_url: null,
          error_message: null,
          created_at: new Date(),
          completed_at: null,
        },
      ];

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: jobs });

      const filter = { status: 'pending' as const, limit: 10, offset: 0 };
      const result = await exportService.listUserJobs('user-001', filter);

      expect(result.jobs.every((j) => j.status === 'pending')).toBe(true);
      expect(result.jobs).toHaveLength(1);
    });

    it('should return empty array if no jobs', async () => {
      const mockDatabase = require('../../config/database');
      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await exportService.listUserJobs('user-001', { limit: 10, offset: 0 });

      expect(result.jobs).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to completed', async () => {
      const mockDatabase = require('../../config/database');

      mockDatabase.pool.query.mockResolvedValueOnce({});

      await exportService.updateJobStatus('export-001', 'completed', 'https://s3.example.com/export.pdf');

      expect(mockDatabase.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE export_jobs'),
        expect.arrayContaining(['completed', 'https://s3.example.com/export.pdf', null, 'export-001'])
      );
    });

    it('should update job status to failed with error message', async () => {
      const mockDatabase = require('../../config/database');

      mockDatabase.pool.query.mockResolvedValueOnce({});

      await exportService.updateJobStatus('export-001', 'failed', undefined, 'PDF generation failed');

      expect(mockDatabase.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE export_jobs'),
        expect.arrayContaining(['failed', null, 'PDF generation failed', 'export-001'])
      );
    });
  });

  describe('processExportJob', () => {
    it('should process export job', async () => {
      const mockDatabase = require('../../config/database');

      const mockJob = {
        id: 'export-001',
        user_id: 'user-001',
        export_type: 'tender_summary',
        format: 'pdf',
        tender_id: 'tender-001',
        vendor_id: null,
        status: 'pending',
        file_url: null,
        error_message: null,
        created_at: new Date(),
        completed_at: null,
      };

      const mockTender = {
        id: 'tender-001',
        title: 'Test Tender',
        tender_number: 'TNT-001',
        status: 'published',
        org_name: 'Test Org',
        visibility: 'public',
        procurement_type: 'open',
        currency: 'USD',
        submission_deadline: new Date(),
        created_at: new Date()
      };

      // Mock calls in sequence:
      // 1. getJobById - SELECT from export_jobs
      // 2. updateJobStatus to 'processing'
      // 3. generateTenderSummaryPdf - SELECT from tenders
      // 4. updateJobStatus to 'completed'
      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [mockJob] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [mockTender] })
        .mockResolvedValueOnce({});

      await exportService.processExportJob('export-001');

      // Verify the function was called and processed correctly
      expect(mockDatabase.pool.query).toHaveBeenCalled();
    });
  });

  describe('generateTenderSummaryPdf', () => {
    it('should generate tender summary PDF', async () => {
      const mockDatabase = require('../../config/database');

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [
          {
            id: 'tender-001',
            title: 'Infrastructure Project',
            tender_number: 'TNT-001',
            status: 'published',
            org_name: 'Test Org',
            visibility: 'public',
            procurement_type: 'open',
            currency: 'USD',
            submission_deadline: new Date(),
            created_at: new Date()
          }
        ] });

      const result = await exportService.generateTenderSummaryPdf('tender-001');

      expect(typeof result).toBe('string');
      expect(result).toContain('tender_summary');
    });
  });

  describe('generateBidComparisonPdf', () => {
    it('should generate bid comparison PDF', async () => {
      const mockDatabase = require('../../config/database');

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [] });

      const result = await exportService.generateBidComparisonPdf('tender-001');

      expect(typeof result).toBe('string');
    });
  });

  describe('generateBidComparisonXlsx', () => {
    it('should generate bid comparison Excel file', async () => {
      const mockDatabase = require('../../config/database');

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [] });

      const result = await exportService.generateBidComparisonXlsx('tender-001');

      expect(typeof result).toBe('string');
    });
  });

  describe('generateBidIntegrityPdf', () => {
    it('should generate bid integrity PDF', async () => {
      const result = await exportService.generateBidIntegrityPdf('tender-001');

      expect(typeof result).toBe('string');
    });
  });

  describe('generateAwardLetterPdf', () => {
    it('should generate award letter PDF', async () => {
      const mockDatabase = require('../../config/database');

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [] });

      const result = await exportService.generateAwardLetterPdf('tender-001', 'vendor-001');

      expect(typeof result).toBe('string');
    });
  });

  describe('generateFullDataDumpXlsx', () => {
    it('should generate full data dump Excel file', async () => {
      const mockDatabase = require('../../config/database');

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [] });

      const result = await exportService.generateFullDataDumpXlsx('tender-001');

      expect(typeof result).toBe('string');
    });
  });
});
