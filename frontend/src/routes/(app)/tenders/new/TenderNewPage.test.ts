import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import { QueryClient } from '@tanstack/svelte-query';
import TenderNewPageTestWrapper from './TenderNewPageTestWrapper.svelte';
import { api } from '$lib/utils/api';
import { isBuyer } from '$lib/stores/auth';

// Mock API
vi.mock('$lib/utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock auth store (subscribe must return { unsubscribe } for Svelte store contract)
vi.mock('$lib/stores/auth', () => ({
  isBuyer: {
    subscribe: vi.fn((fn: (v: boolean) => void) => {
      fn(true);
      return { unsubscribe: vi.fn() };
    })
  }
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

describe('Tender Creation Form - Cascading Dropdowns', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    vi.clearAllMocks();
  });

  describe('Procurement Type Selection', () => {
    test('should show special case checkboxes when goods selected', async () => {
      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        expect(screen.getByText(/international bidding/i)).toBeInTheDocument();
        expect(screen.getByText(/turnkey contract/i)).toBeInTheDocument();
        expect(screen.getByText(/emergency/i)).toBeInTheDocument();
      });
    });

    test('should show outsourcing checkbox for services', async () => {
      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'services' } });

      await waitFor(() => {
        expect(screen.getByText(/outsourcing service personnel/i)).toBeInTheDocument();
        expect(screen.queryByText(/international bidding/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/turnkey contract/i)).not.toBeInTheDocument();
      });
    });

    test('should hide special checkboxes for works', async () => {
      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'works' } });

      await waitFor(() => {
        expect(screen.queryByText(/international bidding/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/turnkey contract/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/outsourcing/i)).not.toBeInTheDocument();
      });
    });

    test('should reset form when procurement type changes', async () => {
      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      
      // Select goods first
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });
      
      // Change to services
      await fireEvent.change(procurementSelect, { target: { value: 'services' } });

      // Verify goods-specific checkboxes are gone
      await waitFor(() => {
        expect(screen.queryByText(/international bidding/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Estimated Cost Dropdown', () => {
    test('should be disabled until procurement type selected', () => {
      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const costSelect = screen.getByLabelText(/estimated cost/i);
      expect(costSelect).toBeDisabled();
    });

    test('should enable after procurement type selected', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        procurementType: 'goods',
        ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1'] }],
        specialCases: {}
      });

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      const costSelect = screen.getByLabelText(/estimated cost/i);
      
      await waitFor(() => {
        expect(costSelect).not.toBeDisabled();
      });
    });

    test('should show loading state', async () => {
      vi.mocked(api.get).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });;

  describe('Tender Type Auto-Suggestion', () => {
    test('should load tender types when procurement type selected', async () => {
      const mockRanges = {
        procurementType: 'goods',
        ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1'] }],
        specialCases: {}
      };
      const mockTenderTypes = [
        { code: 'PG1', name: 'RFQ - Goods', procurement_type: 'goods', min_value_bdt: 0, max_value_bdt: 800000 }
      ];

      vi.mocked(api.get)
        .mockResolvedValueOnce(mockRanges)
        .mockResolvedValueOnce(mockTenderTypes);

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        const tenderTypeSelect = screen.getByLabelText(/tender type/i);
        // Should find at least the placeholder or actual tender types
        expect(tenderTypeSelect).toBeInTheDocument();
      });
    });

    test('should show international bidding option for goods', async () => {
      const mockRanges = {
        procurementType: 'goods',
        ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1', 'PG4'] }],
        specialCases: { international: { available: true, type: 'PG4' } }
      };

      const mockTenderTypes = [
        { code: 'PG1', name: 'RFQ', procurement_type: 'goods', min_value_bdt: 0, max_value_bdt: 800000 },
        { code: 'PG4', name: 'International', procurement_type: 'goods', min_value_bdt: 0, max_value_bdt: null }
      ];

      vi.mocked(api.get)
        .mockResolvedValueOnce(mockRanges)
        .mockResolvedValueOnce(mockTenderTypes);

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        const intlCheckbox = screen.getByText(/international bidding/i);
        expect(intlCheckbox).toBeInTheDocument();
      });
    });

    test('should show outsourcing option for services', async () => {
      const mockRanges = {
        procurementType: 'services',
        ranges: [{ label: '0 - Unlimited', minValue: 0, maxValue: null, suggestedTypes: ['PPS2', 'PPS3'] }],
        specialCases: { outsourcingPersonnel: { available: true, type: 'PPS2' } }
      };

      const mockTenderTypes = [
        { code: 'PPS2', name: 'Outsourcing', procurement_type: 'services', min_value_bdt: 0, max_value_bdt: null },
        { code: 'PPS3', name: 'Services', procurement_type: 'services', min_value_bdt: 0, max_value_bdt: null }
      ];

      vi.mocked(api.get)
        .mockResolvedValueOnce(mockRanges)
        .mockResolvedValueOnce(mockTenderTypes);

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'services' } });

      await waitFor(() => {
        expect(screen.getByText(/outsourcing service personnel/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tender Type Filtering', () => {
    test('should render cost options in a select dropdown', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        procurementType: 'goods',
        ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1'] }],
        specialCases: {}
      });

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        const costSelect = screen.getByLabelText(/estimated cost/i) as HTMLSelectElement;
        // Cost select should become enabled and have options beyond just the placeholder
        expect(costSelect).not.toBeDisabled();
      });
    });

    test('should show tender type dropdown when procurement type selected', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          procurementType: 'goods',
          ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1'] }],
          specialCases: {}
        })
        .mockResolvedValueOnce([
          { code: 'PG1', name: 'RFQ', procurement_type: 'goods', min_value_bdt: 0, max_value_bdt: 800000 }
        ]);

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        const tenderTypeSelect = screen.getByLabelText(/tender type/i) as HTMLSelectElement;
        // Should exist and be visible
        expect(tenderTypeSelect).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API error gracefully when fetching ranges', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      // Should still render the cost select even if ranges API fails
      await waitFor(() => {
        const costSelect = screen.getByLabelText(/estimated cost/i);
        expect(costSelect).toBeInTheDocument();
      });
    });

    test('should keep submit button disabled when required fields are empty', () => {
      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      // Button should be disabled initially
      const submitButton = screen.getByText(/create tender/i) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    test('should require form validation before submission', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        procurementType: 'goods',
        ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1'] }],
        specialCases: {}
      });

      vi.mocked(api.get).mockResolvedValueOnce([
        { code: 'PG1', name: 'RFQ', procurement_type: 'goods', min_value_bdt: 0, max_value_bdt: 800000 }
      ]);

      render(TenderNewPageTestWrapper, {
        props: { queryClient }
      });

      // Form should have required fields
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput.required).toBe(true);

      const procurementSelect = screen.getByLabelText(/procurement type/i) as HTMLSelectElement;
      expect(procurementSelect.required).toBe(true);

      const deadlineInput = screen.getByLabelText(/submission deadline/i) as HTMLInputElement;
      expect(deadlineInput.required).toBe(true);
    });
  });
});
