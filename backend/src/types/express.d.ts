// Global type definitions for Express
// This file extends the Express Request interface to include custom properties

import { OrganizationType } from './organization.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        roles: string[];
        companyId?: string;
        orgId: string;
        organizationType?: OrganizationType;  // NEW
      };
    }
  }
}

export {};
