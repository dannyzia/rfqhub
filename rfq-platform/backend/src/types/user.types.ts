// backend/src/types/user.types.ts
// Description: User type definitions with organization type support
// Phase 1, Task 3

import { OrganizationType } from './organization.types';

export interface UserRow {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  password_hash: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserContext {
  id: string;
  email: string;
  name: string;
  orgId: string;
  organizationName: string;
  organizationType: OrganizationType;  // NEW
  roles: string[];
}

export interface UserWithOrg extends UserRow {
  organization_name?: string;
  organization_type?: OrganizationType;
}

export interface TokenRow {
  id: string;
  user_id: string;
  token_type: string;
  expires_at: string;
  created_at: string;
}
