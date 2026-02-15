// backend/src/types/organization.types.ts
// Description: Organization type definitions for multi-tender system
// Phase 1, Task 3

export enum OrganizationType {
  Government = 'government',
  NonGovernment = 'non-government'
}

export interface Organization {
  id: string;
  name: string;
  type: 'buyer' | 'vendor' | 'both';
  organizationType: OrganizationType;
  createdAt: Date;
}

export interface OrganizationWithType extends Organization {
  organizationType: OrganizationType;
}

export interface OrganizationRow {
  id: string;
  name: string;
  type: 'buyer' | 'vendor' | 'both';
  organization_type: OrganizationType;
  created_at: Date;
}
