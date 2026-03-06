// Frontend type definitions
export enum OrganizationType {
  Government = 'government',
  NonGovernment = 'non-government'
}

export interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  tenderType: string;
  procurementType: string;
  status: string;
  visibility: string;
  currency: string;
  budget?: number;
  submissionDeadline: string;
  bidOpeningTime?: string;
  createdAt: string;
}

export interface CommitteeAssignment {
  id: string;
  tenderId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
}

export interface Bid {
  id: string;
  tenderId: string;
  vendorId: string;
  amount: number;
  status: string;
  createdAt: string;
}
