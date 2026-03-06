import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import VendorDashboard from './VendorDashboard.svelte';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn().mockReturnValue('test-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('VendorDashboard', () => {
  const mockVendorProfile = {
    id: 'vendor-123',
    organization_id: 'org-123',
    company_name: 'Test Vendor Company',
    contact_person: 'John Doe',
    email: 'john@testvendor.com',
    phone: '+1234567890',
    address: '123 Test Street, Test City',
    tax_id: 'TAX123456',
    registration_number: 'REG123456',
    status: 'approved',
    verification_status: 'verified',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  const mockBids = [
    {
      id: 'bid-1',
      tender_id: 'tender-1',
      tender_title: 'Test Tender 1',
      tender_number: 'TDR-2024-001',
      status: 'submitted',
      total_amount: 100000,
      currency: 'BDT',
      submitted_at: '2024-01-10T00:00:00Z',
      qualification_status: 'passed',
    },
    {
      id: 'bid-2',
      tender_id: 'tender-2',
      tender_title: 'Test Tender 2',
      tender_number: 'TDR-2024-002',
      status: 'draft',
      total_amount: 50000,
      currency: 'BDT',
      submitted_at: null,
      qualification_status: 'not_applicable',
    },
  ];

  const mockDocuments = [
    {
      id: 'doc-1',
      document_type: 'Business License',
      file_name: 'business_license.pdf',
      file_size: 1024000,
      upload_date: '2024-01-05T00:00:00Z',
      expiry_date: '2025-01-05T00:00:00Z',
      status: 'valid',
    },
    {
      id: 'doc-2',
      document_type: 'Tax Certificate',
      file_name: 'tax_certificate.pdf',
      file_size: 512000,
      upload_date: '2024-01-10T00:00:00Z',
      expiry_date: null,
      status: 'valid',
    },
  ];

  const mockSubscriptionUsage = {
    tender_limit: 10,
    tender_used: 3,
    bid_limit: 20,
    bid_used: 5,
    storage_limit_mb: 100,
    storage_used_mb: 25,
    live_session_limit: 5,
    live_session_used: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-token');
  });

  it('renders vendor dashboard with loading state', () => {
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(VendorDashboard);

    expect(screen.getByText('Vendor Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage your profile, bids, and documents')).toBeInTheDocument();
  });

  it('loads and displays vendor profile data', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Test Vendor Company')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@testvendor.com')).toBeInTheDocument();
      expect(screen.getByText('verified')).toBeInTheDocument();
    });
  });

  it('displays subscription usage statistics', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('3/10')).toBeInTheDocument();
      expect(screen.getByText('5/20')).toBeInTheDocument();
      expect(screen.getByText('25/100 MB')).toBeInTheDocument();
      expect(screen.getByText('1/5')).toBeInTheDocument();
    });
  });

  it('displays bid statistics', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      // Draft: 1, Submitted: 1 — two separate '1' stat elements
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('filters bids by status', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Test Tender 1')).toBeInTheDocument();
      expect(screen.getByText('Test Tender 2')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const bidStatusSelect = screen.getByRole('combobox', { name: /filter by status/i });
    
    await user.selectOptions(bidStatusSelect, 'draft');

    await waitFor(() => {
      expect(screen.getByText('Test Tender 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Tender 1')).not.toBeInTheDocument();
    });
  });

  it('displays documents with correct formatting', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Business License')).toBeInTheDocument();
      // formatFileSize(1024000) → "1000 KB" (1024000 bytes < 1 MB threshold of 1048576)
      expect(screen.getByText('business_license.pdf (1000 KB)')).toBeInTheDocument();
      expect(screen.getByText('Tax Certificate')).toBeInTheDocument();
      expect(screen.getByText('tax_certificate.pdf (500 KB)')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles missing authentication token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    mockFetch.mockRejectedValueOnce(new Error('Unauthorized'));

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  it('uploads document successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'doc-3', document_type: 'New Document' } }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const fileInput = screen.getByLabelText('Upload');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/vendors/documents', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      }));
    });
  });

  it('deletes document with confirmation', async () => {
    window.confirm = vi.fn().mockReturnValue(true);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Business License')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByText('Delete');
    
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document?');
      expect(mockFetch).toHaveBeenCalledWith('/api/vendors/documents/doc-1', expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      }));
    });
  });

  it('cancels document deletion when user declines confirmation', async () => {
    window.confirm = vi.fn().mockReturnValue(false);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVendorProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBids }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubscriptionUsage }),
      });

    render(VendorDashboard);

    await waitFor(() => {
      expect(screen.getByText('Business License')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByText('Delete');
    
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document?');
    expect(mockFetch).not.toHaveBeenCalledWith('/api/vendors/documents/doc-1', expect.any(Object));
  });
});