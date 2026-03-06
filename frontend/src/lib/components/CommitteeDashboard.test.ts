import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import CommitteeDashboard from "./CommitteeDashboard.svelte";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn().mockReturnValue("test-token"),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("CommitteeDashboard", () => {
  const mockCommittees = [
    {
      id: "committee-1",
      tender_id: "tender-1",
      tender_title: "Test Tender 1",
      tender_number: "TDR-2024-001",
      status: "active",
      members: [
        {
          id: "member-1",
          user_id: "user-1",
          user_name: "John Doe",
          user_email: "john@example.com",
          role: "Technical Evaluator",
          status: "active",
          assigned_at: "2024-01-01T00:00:00Z",
          completed_at: null,
        },
        {
          id: "member-2",
          user_id: "user-2",
          user_name: "Jane Smith",
          user_email: "jane@example.com",
          role: "Commercial Evaluator",
          status: "pending",
          assigned_at: "2024-01-02T00:00:00Z",
          completed_at: null,
        },
      ],
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "committee-2",
      tender_id: "tender-2",
      tender_title: "Test Tender 2",
      tender_number: "TDR-2024-002",
      status: "completed",
      members: [
        {
          id: "member-3",
          user_id: "user-3",
          user_name: "Bob Johnson",
          user_email: "bob@example.com",
          role: "Pre-Qualification Evaluator",
          status: "completed",
          assigned_at: "2024-01-05T00:00:00Z",
          completed_at: "2024-01-10T00:00:00Z",
        },
      ],
      created_at: "2024-01-05T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("test-token");
  });

  it("renders committee dashboard with loading state", () => {
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(CommitteeDashboard);

    expect(screen.getByText("Committee Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage tender evaluation committees and track progress",
      ),
    ).toBeInTheDocument();
  });

  it("loads and displays committee data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      expect(screen.getByText("Test Tender 1")).toBeInTheDocument();
      expect(screen.getByText("TDR-2024-001")).toBeInTheDocument();
      expect(screen.getByText("Test Tender 2")).toBeInTheDocument();
      expect(screen.getByText("TDR-2024-002")).toBeInTheDocument();
    });
  });

  it("displays committee statistics", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      // One active, one completed — two separate '1' elements in the stats grid
      const ones = screen.getAllByText("1");
      expect(ones.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("displays committee members with correct status indicators", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      // Check first committee members
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Technical Evaluator")).toBeInTheDocument();
      expect(screen.getByText("Commercial Evaluator")).toBeInTheDocument();

      // Check status indicators
      expect(screen.getAllByText("active").length).toBeGreaterThan(0);
      expect(screen.getAllByText("pending").length).toBeGreaterThan(0);
    });
  });

  it("filters committees by status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      expect(screen.getByText("Test Tender 1")).toBeInTheDocument();
      expect(screen.getByText("Test Tender 2")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const statusSelect = screen.getByRole("combobox", {
      name: /filter by status/i,
    });

    await user.selectOptions(statusSelect, "completed");

    await waitFor(() => {
      expect(screen.getByText("Test Tender 2")).toBeInTheDocument();
      expect(screen.queryByText("Test Tender 1")).not.toBeInTheDocument();
    });
  });

  it("displays committee creation dates", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      // Verify "Created:" prefix is present (date format is locale-sensitive)
      const createdDates = screen.getAllByText(/Created:/);
      expect(createdDates.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Members: 2")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(CommitteeDashboard);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("handles missing authentication token", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    mockFetch.mockRejectedValueOnce(new Error("Unauthorized"));

    render(CommitteeDashboard);

    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });
  });

  it("displays empty state when no committees found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      expect(screen.getByText("No committees found")).toBeInTheDocument();
      expect(
        screen.getByText("You are not assigned to any tender committees yet"),
      ).toBeInTheDocument();
    });
  });

  it("displays filtered empty state message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      expect(screen.getByText("Test Tender 1")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const statusSelect = screen.getByRole("combobox", {
      name: /filter by status/i,
    });

    await user.selectOptions(statusSelect, "cancelled");

    await waitFor(() => {
      expect(screen.getByText("No committees found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your filters"),
      ).toBeInTheDocument();
    });
  });

  it("has functional refresh button", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      expect(screen.getByText("Test Tender 1")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const refreshButton = screen.getByRole("button", { name: /refresh/i });

    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/committee/my-committees",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });
  });

  it("displays member avatars with initials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      // Check that member avatars are displayed with initials
      const avatarElements = screen.getAllByText(/^[A-Z]$/);
      expect(avatarElements.length).toBeGreaterThan(0);

      // Check specific initials — John and Jane both have 'J', use getAllByText
      const jInitials = screen.getAllByText("J");
      expect(jInitials.length).toBeGreaterThanOrEqual(2); // John Doe + Jane Smith
      expect(screen.getByText("B")).toBeInTheDocument(); // Bob Johnson
    });
  });

  it("displays correct status colors for committees and members", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCommittees }),
    });

    render(CommitteeDashboard);

    await waitFor(() => {
      // Check committee status indicators
      const activeStatus = screen.getAllByText("active")[0];
      const completedStatus = screen.getAllByText("completed")[0];

      expect(activeStatus).toHaveClass("bg-green-100", "text-green-800");
      expect(completedStatus).toHaveClass("bg-blue-100", "text-blue-800");
    });
  });
});
