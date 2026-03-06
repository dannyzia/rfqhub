/**
 * Test Mocks and Fixtures - Section 2: Test Infrastructure
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Common mock data factories and test fixtures
 * for integration test scenarios
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Mock user data factory
 */
export const createMockUser = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  email: `test-${Date.now()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  password: 'HashedPassword123',
  phone: '+1234567890',
  role: 'buyer',
  organizationId: uuidv4(),
  active: true,
  emailVerified: true,
  mfaEnabled: false,
  mfaSecret: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock organization data factory
 */
export const createMockOrganization = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  name: `Test Org ${Date.now()}`,
  type: 'government',
  registrationNumber: `REG-${Date.now()}`,
  taxId: `TAX-${Date.now()}`,
  country: 'US',
  state: 'CA',
  city: 'San Francisco',
  address: '123 Test Street',
  website: 'https://example.com',
  industry: 'Technology',
  employeeCount: '100-500',
  subscription: 'gold',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock tender data factory
 */
export const createMockTender = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  referenceNumber: `TEND-${Date.now()}`,
  title: 'Test Tender',
  description: 'This is a test tender',
  status: 'draft',
  organizationId: uuidv4(),
  publishedDate: null,
  closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  tenderTypeId: uuidv4(),
  estimatedBudget: 100000,
  currency: 'USD',
  publicationMethod: 'open',
  evaluationMethod: 'technical_and_financial',
  preQualificationRequired: false,
  minimumParticipants: 3,
  category: 'supply',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock tender item data factory
 */
export const createMockTenderItem = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  tenderId: uuidv4(),
  description: 'Test Item',
  quantity: 100,
  unit: 'pieces',
  estimatedUnitPrice: 1000,
  specifications: 'Test specifications',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock bid data factory
 */
export const createMockBid = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  tenderId: uuidv4(),
  vendorId: uuidv4(),
  amount: 50000,
  currency: 'USD',
  status: 'submitted',
  validityPeriod: 30,
  paymentTerms: 'NET30',
  deliveryTime: 30,
  qualifications: 'Test qualifications',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock bid item data factory
 */
export const createMockBidItem = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  bidId: uuidv4(),
  tenderId: uuidv4(),
  tenderItemId: uuidv4(),
  quantity: 100,
  unitPrice: 500,
  discount: 0,
  total: 50000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock evaluation data factory
 */
export const createMockEvaluation = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  tenderId: uuidv4(),
  title: 'Test Evaluation',
  status: 'planning',
  evaluationType: 'technical_and_financial',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock evaluation score data factory
 */
export const createMockEvaluationScore = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  evaluationId: uuidv4(),
  bidId: uuidv4(),
  criterionId: uuidv4(),
  score: 85,
  maxScore: 100,
  weight: 0.5,
  remarks: 'Test remarks',
  evaluatedBy: uuidv4(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock award data factory
 */
export const createMockAward = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  tenderId: uuidv4(),
  vendorId: uuidv4(),
  bidId: uuidv4(),
  awardedAmount: 50000,
  currency: 'USD',
  status: 'pending',
  awardDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock vendor data factory
 */
export const createMockVendor = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  organizationId: uuidv4(),
  companyName: `Test Vendor ${Date.now()}`,
  registrationNumber: `REG-${Date.now()}`,
  taxId: `TAX-${Date.now()}`,
  country: 'US',
  state: 'CA',
  city: 'San Francisco',
  address: '123 Test Street',
  contactPerson: 'Test Contact',
  contactEmail: `vendor-${Date.now()}@example.com`,
  contactPhone: '+1234567890',
  website: 'https://vendor.example.com',
  industry: 'Technology',
  yearsInOperation: 5,
  certifications: ['ISO 9001'],
  bankDetails: {
    accountNumber: '123456789',
    routingNumber: '987654321',
  },
  active: true,
  verified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock notification data factory
 */
export const createMockNotification = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  userId: uuidv4(),
  type: 'tender_published',
  subject: 'Test Notification',
  message: 'This is a test notification',
  data: {},
  read: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock document data factory
 */
export const createMockDocument = (overrides?: Partial<any>) => ({
  id: uuidv4(),
  tenderId: uuidv4(),
  fileName: 'test-document.pdf',
  fileType: 'application/pdf',
  fileSize: 1024,
  fileKey: `documents/${Date.now()}/test-document.pdf`,
  uploadedBy: uuidv4(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock tender type data factory
 */
export const createMockTenderType = (overrides?: Partial<any>) => ({
  code: `TEST-${Date.now()}`,
  name: `Test Tender Type ${Date.now()}`,
  description: 'Test descriptor',
  is_active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock registration request factory
 */
export const createMockRegistrationRequest = (overrides?: Partial<any>) => ({
  email: `register-${Date.now()}@example.com`,
  password: 'TestPassword123@!',
  confirmPassword: 'TestPassword123@!',
  firstName: 'Test',
  lastName: 'User',
  companyName: `Test Organization ${Date.now()}`,
  role: 'buyer',
  country: 'US',
  ...overrides,
});

/**
 * Mock login request factory
 */
export const createMockLoginRequest = (overrides?: Partial<any>) => ({
  email: 'test@example.com',
  password: 'TestPassword123@',
  ...overrides,
});

/**
 * Mock tender creation request factory
 * Fields match CreateTenderInput (backend/src/schemas/tender.schema.ts):
 *  - tenderType: valid code from tender_type_definitions (NRQ1 = min 2 days, no security required)
 *  - submissionDeadline: ISO string at least min_submission_days from now
 *  - visibility: 'open' | 'limited'
 *  - procurementType: 'goods' | 'works' | 'services'
 *  - estimatedCost is intentionally omitted; when present it triggers BDT value-range
 *    validation via the superRefine async callback in createTenderSchema. Tests that
 *    need estimatedCost should override with a BDT-range-valid value (e.g., 5_000_000).
 */
export const createMockTenderRequest = (overrides?: Partial<any>) => ({
  title: 'Test Tender',
  description: 'This is a test tender',
  tenderType: 'NRQ1',
  visibility: 'open',
  procurementType: 'goods',
  submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  currency: 'BDT',
  ...overrides,
});

/**
 * Mock bid submission request factory
 */
export const createMockBidRequest = (overrides?: Partial<any>) => ({
  amount: 50000,
  currency: 'USD',
  validityPeriod: 30,
  paymentTerms: 'NET30',
  deliveryTime: 30,
  qualifications: 'Test qualifications',
  items: [
    {
      tenderItemId: uuidv4(),
      quantity: 100,
      unitPrice: 500,
    },
  ],
  ...overrides,
});

/**
 * Fixture: Complete tender scenario with items
 */
export const createTenderWithItems = (tenderOverrides?: Partial<any>, itemCount = 3) => {
  const tender = createMockTender(tenderOverrides);
  const items = Array.from({ length: itemCount }, () =>
    createMockTenderItem({ tenderId: tender.id })
  );
  return { tender, items };
};

/**
 * Fixture: Complete bid scenario with items
 */
export const createBidWithItems = (bidOverrides?: Partial<any>, itemCount = 3) => {
  const bid = createMockBid(bidOverrides);
  const items = Array.from({ length: itemCount }, () =>
    createMockBidItem({ bidId: bid.id, tenderId: bid.tenderId })
  );
  return { bid, items };
};

/**
 * Fixture: Complete evaluation with multiple bids and scores
 */
export const createEvaluationWithBids = (
  evaluationOverrides?: Partial<any>,
  bidCount = 3
) => {
  const evaluation = createMockEvaluation(evaluationOverrides);
  const bids = Array.from({ length: bidCount }, () =>
    createMockBid({ tenderId: evaluation.tenderId })
  );
  const scores = bids.flatMap(bid =>
    Array.from({ length: 3 }, () =>
      createMockEvaluationScore({
        evaluationId: evaluation.id,
        bidId: bid.id,
      })
    )
  );
  return { evaluation, bids, scores };
};

export default {
  // Factory functions
  createMockUser,
  createMockOrganization,
  createMockTender,
  createMockTenderItem,
  createMockBid,
  createMockBidItem,
  createMockEvaluation,
  createMockEvaluationScore,
  createMockAward,
  createMockVendor,
  createMockNotification,
  createMockDocument,
  createMockTenderType,

  // Request factories
  createMockRegistrationRequest,
  createMockLoginRequest,
  createMockTenderRequest,
  createMockBidRequest,

  // Fixtures
  createTenderWithItems,
  createBidWithItems,
  createEvaluationWithBids,
};
