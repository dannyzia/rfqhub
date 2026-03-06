// Workflow-related types
export interface TenderRoleAssignment {
  id: string;
  tenderId: string;
  userId: string;
  role: string;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'forwarded';
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowLog {
  id: string;
  tenderId: string;
  role: string;
  status: string;
  timestamp: string;
  notes?: string;
}

export interface ProcurementRole {
  id: string;
  name: string;
  description: string;
  order: number;
}
