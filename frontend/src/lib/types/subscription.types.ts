// Subscription type definitions
export interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  storageQuota: number;
  tenderQuota: number;
  billingCycle: 'monthly' | 'yearly';
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  packageId: string;
  status: 'active' | 'inactive' | 'cancelled';
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  storageUsed: number;
  tendersUsed: number;
}

export interface SubscriptionUsage {
  storageUsed: number;
  storageQuota: number;
  tendersUsed: number;
  tendersQuota: number;
}
