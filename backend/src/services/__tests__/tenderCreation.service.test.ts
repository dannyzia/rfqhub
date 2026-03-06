import { TenderCreationService, tenderCreationService } from '../tenderCreation.service';

jest.mock('../../config/database');
jest.mock('../../config/redis');
jest.mock('../subscription.service');
jest.mock('../roleAssignment.service');

describe('TenderCreationService', () => {
  let mockPool: any;
  let mockClient: any;
  let mockSubscriptionService: any;
  let mockRoleAssignmentService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the auto-mocked database module (pool is the default export)
    const mockDb = require('../../config/database');
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    };
    // default export is the pool
    mockPool = mockDb.default;
    mockPool.query = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    mockPool.connect = jest.fn().mockResolvedValue(mockClient);

    // Also patch the named export to point to the same mock
    mockDb.pool = mockPool;

    mockSubscriptionService = require('../subscription.service').SubscriptionService;
    mockRoleAssignmentService = require('../roleAssignment.service').RoleAssignmentService;

    // Default happy-path subscription mocks
    mockSubscriptionService.checkAndIncrementQuota = jest.fn().mockResolvedValue({ allowed: true });
    mockSubscriptionService.getOrganizationSubscription = jest.fn().mockResolvedValue({
      id: 'sub-001',
      package_code: 'standard',
      live_tendering_enabled: true,
      weekly_simple_rfq_limit: 5,
      weekly_detailed_tender_limit: 3,
    });
    mockSubscriptionService.checkTenderQuota = jest.fn().mockResolvedValue(true);
    mockRoleAssignmentService.assignRole = jest.fn().mockResolvedValue(undefined);
    mockRoleAssignmentService.getTenderRoleAssignments = jest.fn().mockResolvedValue([]);
  });

  // ─────────────────────────────────────────────────────────
  // validateTenderCreation
  // ─────────────────────────────────────────────────────────
  describe('validateTenderCreation', () => {
    it('should return canCreate=true for valid org with active subscription', async () => {
      const result = await TenderCreationService.validateTenderCreation(
        'org-001',
        'simple_rfq',
        false,
      );

      expect(result).toEqual({ canCreate: true });
      expect(mockSubscriptionService.getOrganizationSubscription).toHaveBeenCalledWith('org-001');
    });

    it('should return canCreate=false when no active subscription', async () => {
      mockSubscriptionService.getOrganizationSubscription.mockResolvedValue(null);

      const result = await TenderCreationService.validateTenderCreation(
        'org-002',
        'simple_rfq',
        false,
      );

      expect(result).toEqual({ canCreate: false, reason: 'No active subscription' });
    });

    it('should return canCreate=false when quota exceeded', async () => {
      mockSubscriptionService.checkTenderQuota.mockResolvedValue(false);

      const result = await TenderCreationService.validateTenderCreation(
        'org-003',
        'simple_rfq',
        false,
      );

      expect(result).toEqual({ canCreate: false, reason: 'Tender creation quota exceeded' });
    });

    it('should return canCreate=false when live tendering not in subscription', async () => {
      mockSubscriptionService.getOrganizationSubscription.mockResolvedValue({
        id: 'sub-001',
        package_code: 'free',
        live_tendering_enabled: false,
      });

      const result = await TenderCreationService.validateTenderCreation(
        'org-004',
        'simple_rfq',
        true, // requesting live tendering
      );

      expect(result).toEqual({
        canCreate: false,
        reason: 'Live tendering not enabled in subscription',
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // createTenderWithWorkflow
  // ─────────────────────────────────────────────────────────
  describe('createTenderWithWorkflow', () => {
    const baseTenderData = {
      title: 'Test Tender',
      description: 'Test Description',
      tender_number: 'TN-2024-001',
      tender_type: 'PG2',
      procurement_type: 'goods',
      currency: 'BDT',
      submission_deadline: new Date(Date.now() + 86400000).toISOString(),
      bid_opening_time: new Date(Date.now() + 90000000).toISOString(),
      is_simple_rfq: false,
      is_live_tendering: false,
    };

    it('should create tender with workflow and return the created record', async () => {
      const expectedTender = { id: 'tender-001', ...baseTenderData, status: 'draft' };

      // pool.query (getTenderTypeDefinition) returns no type def → autoAssignRoles skipped
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
      // client.query calls: BEGIN, INSERT tenders (returns row), COMMIT
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [expectedTender], rowCount: 1 }) // INSERT
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await TenderCreationService.createTenderWithWorkflow(
        baseTenderData,
        'user-001',
        'org-001',
      );

      expect(result).toEqual(expectedTender);
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockRoleAssignmentService.assignRole).toHaveBeenCalled();
    });

    it('should rollback transaction and throw on database error', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Database connection failed')); // INSERT fails

      await expect(
        TenderCreationService.createTenderWithWorkflow(baseTenderData, 'user-001', 'org-001'),
      ).rejects.toThrow('Database connection failed');

      // ROLLBACK should have been called
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw when quota exceeded', async () => {
      mockSubscriptionService.checkAndIncrementQuota.mockResolvedValue({ allowed: false });

      await expect(
        TenderCreationService.createTenderWithWorkflow(baseTenderData, 'user-001', 'org-001'),
      ).rejects.toThrow('Tender creation quota exceeded for this week');
    });

    it('should throw when no active subscription', async () => {
      mockSubscriptionService.getOrganizationSubscription.mockResolvedValue(null);

      await expect(
        TenderCreationService.createTenderWithWorkflow(baseTenderData, 'user-001', 'org-001'),
      ).rejects.toThrow('No active subscription');
    });
  });

  // ─────────────────────────────────────────────────────────
  // createLiveSession
  // ─────────────────────────────────────────────────────────
  describe('createLiveSession', () => {
    it('should insert live session and update tender', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT live_bidding_sessions
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE tenders.live_session_id

      await expect(
        TenderCreationService.createLiveSession('tender-001', 'user-001'),
      ).resolves.toBeUndefined();

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw on database error in createLiveSession', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(
        TenderCreationService.createLiveSession('tender-001', 'user-001'),
      ).rejects.toThrow('DB error');
    });
  });

  // ─────────────────────────────────────────────────────────
  // updateWorkflowStatus
  // ─────────────────────────────────────────────────────────
  describe('updateWorkflowStatus', () => {
    it('should update workflow status without throwing', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await expect(
        TenderCreationService.updateWorkflowStatus('tender-001', 'active'),
      ).resolves.toBeUndefined();

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should include currentRole in update when provided', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await TenderCreationService.updateWorkflowStatus('tender-001', 'active', 'procurer');

      const sql: string = mockPool.query.mock.calls[0][0];
      expect(sql).toContain('current_workflow_role');
    });

    it('should throw on database error', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(
        TenderCreationService.updateWorkflowStatus('tender-002', 'cancelled'),
      ).rejects.toThrow('DB error');
    });
  });

  // ─────────────────────────────────────────────────────────
  // getWorkflowStatus
  // ─────────────────────────────────────────────────────────
  describe('getWorkflowStatus', () => {
    it('should return workflow status for existing tender', async () => {
      const mockStatus = {
        workflow_status: 'draft',
        current_workflow_role: 'procurer',
        status: 'draft',
      };
      mockPool.query.mockResolvedValue({ rows: [mockStatus], rowCount: 1 });

      const result = await TenderCreationService.getWorkflowStatus('tender-001');

      expect(result).toEqual(mockStatus);
    });

    it('should return null for non-existent tender', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await TenderCreationService.getWorkflowStatus('tender-999');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────
  // canPublishTender
  // ─────────────────────────────────────────────────────────
  describe('canPublishTender', () => {
    it('should return canPublish=true when procurer role is active', async () => {
      // getWorkflowStatus returns draft status
      mockPool.query.mockResolvedValue({
        rows: [{ workflow_status: 'draft', current_workflow_role: 'procurer', status: 'draft' }],
        rowCount: 1,
      });
      mockRoleAssignmentService.getTenderRoleAssignments.mockResolvedValue([
        { role_type: 'procurer', status: 'active', user_id: 'user-001' },
      ]);

      const result = await TenderCreationService.canPublishTender('tender-001');

      expect(result).toEqual({ canPublish: true });
    });

    it('should return canPublish=false when tender not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await TenderCreationService.canPublishTender('tender-999');

      expect(result).toEqual({ canPublish: false, reason: 'Tender not found' });
    });

    it('should return canPublish=false when tender not in draft status', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ workflow_status: 'active', current_workflow_role: 'procurer', status: 'active' }],
        rowCount: 1,
      });

      const result = await TenderCreationService.canPublishTender('tender-002');

      expect(result).toEqual({ canPublish: false, reason: 'Tender is not in draft status' });
    });

    it('should return canPublish=false when procurer role not assigned', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ workflow_status: 'draft', current_workflow_role: 'procurer', status: 'draft' }],
        rowCount: 1,
      });
      mockRoleAssignmentService.getTenderRoleAssignments.mockResolvedValue([]); // no roles

      const result = await TenderCreationService.canPublishTender('tender-003');

      expect(result).toEqual({ canPublish: false, reason: 'Procurer role not assigned' });
    });

    it('should return canPublish=false when procurer role is inactive', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ workflow_status: 'draft', current_workflow_role: 'procurer', status: 'draft' }],
        rowCount: 1,
      });
      mockRoleAssignmentService.getTenderRoleAssignments.mockResolvedValue([
        { role_type: 'procurer', status: 'pending', user_id: 'user-001' },
      ]);

      const result = await TenderCreationService.canPublishTender('tender-004');

      expect(result).toEqual({ canPublish: false, reason: 'Procurer role is not active' });
    });
  });

  // Verify compatibility alias
  it('tenderCreationService alias refers to the same class', () => {
    expect(tenderCreationService).toBe(TenderCreationService);
  });
});
