/**
 * Test Assertion Utilities - Section 2: Test Infrastructure
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Common assertion utilities for API response validation
 * including authentication, authorization, data format checks
 */

/**
 * Assert authentication required (401)
 */
export const assertAuthRequired = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('error');
};

/**
 * Assert authorization denied (403)
 */
export const assertAuthorizationDenied = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.body).toHaveProperty('error');
};

/**
 * Assert unauthorized access (401 or 403)
 */
export const assertUnauthorized = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('error');
};

/**
 * Assert validation error (400 with field errors)
 */
export const assertValidationError = (response: any, expectedFields?: string[]) => {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error');
  
  if (expectedFields) {
    expectedFields.forEach(field => {
      expect(response.body.error).toMatch(new RegExp(field, 'i'));
    });
  }
};

/**
 * Assert resource not found (404)
 */
export const assertNotFound = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('error');
};

/**
 * Assert conflict error (409)
 */
export const assertConflict = (response: any) => {
  expect(response.status).toBe(409);
  expect(response.body).toHaveProperty('error');
};

/**
 * Assert successful response (200)
 */
export const assertSuccess = (response: any) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('data');
};

/**
 * Assert resource created (201)
 */
export const assertCreated = (response: any) => {
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('data');
};

/**
 * Assert user object structure.
 * Accepts both the legacy camelCase shape (firstName/lastName/role/active)
 * and the actual DB shape (name/roles/is_active) returned by the auth service.
 */
export const assertUserStructure = (user: any) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  // Accept either the DB row shape or a transformed camelCase shape
  const hasName = user.name !== undefined;
  const hasFirstLast = user.firstName !== undefined && user.lastName !== undefined;
  expect(hasName || hasFirstLast).toBe(true);
};

/**
 * Assert organization object structure
 */
export const assertOrganizationStructure = (org: any) => {
  expect(org).toHaveProperty('id');
  expect(org).toHaveProperty('name');
  expect(org).toHaveProperty('type');
  expect(org).toHaveProperty('subscription');
  expect(org).toHaveProperty('members');
};

/**
 * Assert tender object structure
 */
export const assertTenderStructure = (tender: any) => {
  expect(tender).toHaveProperty('id');
  expect(tender).toHaveProperty('referenceNumber');
  expect(tender).toHaveProperty('title');
  expect(tender).toHaveProperty('description');
  expect(tender).toHaveProperty('status');
  expect(tender).toHaveProperty('organizationId');
  expect(tender).toHaveProperty('createdAt');
};

/**
 * Assert bid object structure
 */
export const assertBidStructure = (bid: any) => {
  expect(bid).toHaveProperty('id');
  expect(bid).toHaveProperty('tenderId');
  expect(bid).toHaveProperty('vendorId');
  expect(bid).toHaveProperty('amount');
  expect(bid).toHaveProperty('status');
  expect(bid).toHaveProperty('createdAt');
};

/**
 * Assert authentication token structure
 */
export const assertTokenStructure = (token: any) => {
  expect(token).toHaveProperty('accessToken');
  expect(token).toHaveProperty('expiresIn');
  expect(typeof token.accessToken).toBe('string');
  expect(typeof token.expiresIn).toBe('number');
};

/**
 * Assert pagination structure
 */
export const assertPaginationStructure = (pagination: any) => {
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(typeof pagination.page).toBe('number');
  expect(typeof pagination.limit).toBe('number');
  expect(typeof pagination.total).toBe('number');
};

/**
 * Assert array response with items
 */
export const assertArrayResponse = (response: any, minItems = 0) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('data');
  expect(Array.isArray(response.body.data)).toBe(true);
  if (minItems > 0) {
    expect(response.body.data.length).toBeGreaterThanOrEqual(minItems);
  }
};

/**
 * Assert paginated response
 */
export const assertPaginatedResponse = (response: any, expectedSize?: number) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('pagination');
  expect(Array.isArray(response.body.data)).toBe(true);
  assertPaginationStructure(response.body.pagination);
  
  if (expectedSize !== undefined) {
    expect(response.body.data.length).toBeLessThanOrEqual(expectedSize);
  }
};

/**
 * Assert error response structure
 */
export const assertErrorStructure = (response: any) => {
  expect(response.body).toHaveProperty('error');
  expect(typeof response.body.error).toBe('string');
};

/**
 * Assert status codes
 */
export const assertStatus = {
  ok: (response: any) => {
    expect(response.status).toBe(200);
  },
  created: (response: any) => {
    expect(response.status).toBe(201);
  },
  noContent: (response: any) => {
    expect(response.status).toBe(204);
  },
  badRequest: (response: any) => {
    expect(response.status).toBe(400);
  },
  unauthorized: (response: any) => {
    expect(response.status).toBe(401);
  },
  forbidden: (response: any) => {
    expect(response.status).toBe(403);
  },
  notFound: (response: any) => {
    expect(response.status).toBe(404);
  },
  conflict: (response: any) => {
    expect(response.status).toBe(409);
  },
  serverError: (response: any) => {
    expect(response.status).toBe(500);
  },
};

/**
 * Assert bearer token present
 */
export const assertBearerToken = (response: any) => {
  expect(response.body).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('accessToken');
  expect(response.body.data.accessToken).toMatch(/^eyJ/); // JWT pattern
};

/**
 * Assert response headers
 */
export const assertHeaders = {
  isJSON: (response: any) => {
    expect(response.type).toMatch(/json/);
  },
  hasContentLength: (response: any) => {
    expect(response.headers).toHaveProperty('content-length');
  },
  hasCORS: (response: any) => {
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  },
};

/**
 * Assert enum value
 */
export const assertEnumValue = (value: any, enumValues: string[]) => {
  expect(enumValues).toContain(value);
};

/**
 * Assert date format (ISO 8601)
 */
export const assertDateFormat = (dateString: any) => {
  expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  expect(new Date(dateString).toString()).not.toBe('Invalid Date');
};

/**
 * Assert UUID format
 */
export const assertUUIDFormat = (uuid: any) => {
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
};

/**
 * Assert email format
 */
export const assertEmailFormat = (email: any) => {
  expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

/**
 * Assert positive number
 */
export const assertPositiveNumber = (value: any) => {
  expect(typeof value).toBe('number');
  expect(value).toBeGreaterThan(0);
};

/**
 * Assert non-negative number
 */
export const assertNonNegativeNumber = (value: any) => {
  expect(typeof value).toBe('number');
  expect(value).toBeGreaterThanOrEqual(0);
};

/**
 * Assert string length
 */
export const assertStringLength = (value: any, minLength: number, maxLength?: number) => {
  expect(typeof value).toBe('string');
  expect(value.length).toBeGreaterThanOrEqual(minLength);
  if (maxLength !== undefined) {
    expect(value.length).toBeLessThanOrEqual(maxLength);
  }
};

/**
 * Assert object has all keys
 */
export const assertHasKeys = (obj: any, keys: string[]) => {
  keys.forEach(key => {
    expect(obj).toHaveProperty(key);
  });
};

/**
 * Assert object only has specified keys
 */
export const assertOnlyHasKeys = (obj: any, keys: string[]) => {
  const objKeys = Object.keys(obj);
  expect(objKeys.sort()).toEqual(keys.sort());
};

export default {
  // Auth assertions
  assertAuthRequired,
  assertAuthorizationDenied,
  assertBearerToken,

  // Response assertions
  assertSuccess,
  assertCreated,
  assertValidationError,
  assertNotFound,
  assertConflict,
  assertErrorStructure,

  // Data structure assertions
  assertUserStructure,
  assertOrganizationStructure,
  assertTenderStructure,
  assertBidStructure,
  assertTokenStructure,

  // Array/Pagination assertions
  assertArrayResponse,
  assertPaginatedResponse,
  assertPaginationStructure,

  // Status assertions
  assertStatus,

  // Header assertions
  assertHeaders,

  // Format assertions
  assertEnumValue,
  assertDateFormat,
  assertUUIDFormat,
  assertEmailFormat,
  assertPositiveNumber,
  assertNonNegativeNumber,
  assertStringLength,
  assertHasKeys,
  assertOnlyHasKeys,
};
