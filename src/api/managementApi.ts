import { apiRequest } from './apiClient';

export type ManagementProductionAdvisor = {
  userId: string;
  firstName: string;
  lastName: string;
  issuedAmount: number;
  issuedCount: number;
  nonIssuedAmount: number;
  nonIssuedCount: number;
  goalAmount: number | null;
  attainmentPercent: number | null;
};

export type ManagementProductionSummary = {
  period: string;
  advisorCount: number;
  issuedAmount: number;
  issuedCount: number;
  nonIssuedAmount: number;
  nonIssuedCount: number;
  advisors: ManagementProductionAdvisor[];
};

export type ManagementPipelineFilters = {
  advisorId?: string;
  stage?: string;
  status?: string;
  search?: string;
};

export type ManagementPipelineCase = {
  caseId: string;
  advisor: {
    userId: string;
    firstName: string;
    lastName: string;
  };
  contactName: string | null;
  currentStage: string;
  status: string;
  createdAt: string;
  lastUpdatedAt: string;
  estimatedCommission: number | null;
  nextStepDate: string | null;
  nextScheduledActivity: {
    title: string | null;
    pipelineStage: string | null;
    dueAt: string | null;
    dueDate: string | null;
  } | null;
  fica: {
    idReceived: boolean;
    residenceReceived: boolean;
    bankReceived: boolean;
    skipAcknowledged: boolean;
  };
  documents: {
    totalCount: number;
    receivedCount: number;
  };
};

export type ManagementPipelineResponse = {
  advisorCount: number;
  caseCount: number;
  stageCounts: Record<string, number>;
  totalEstimatedCommission: number;
  estimatedCommissionCaseCount: number;
  cases: ManagementPipelineCase[];
};

/** AdvisorTrack-recorded production for the authenticated management scope. */
export async function getManagementProductionSummary(
  month: string,
): Promise<ManagementProductionSummary> {
  return apiRequest<ManagementProductionSummary>(
    `/management/production/summary?month=${encodeURIComponent(month)}`,
  );
}

/** Real case pipeline limited by the authenticated user's management scope. */
export async function getManagementPipeline(
  filters: ManagementPipelineFilters = {},
): Promise<ManagementPipelineResponse> {
  const query = new URLSearchParams();
  if (filters.advisorId) query.set('advisorId', filters.advisorId);
  if (filters.stage) query.set('stage', filters.stage);
  if (filters.status) query.set('status', filters.status);
  if (filters.search) query.set('search', filters.search);

  const queryString = query.toString();
  return apiRequest<ManagementPipelineResponse>(
    `/management/pipeline${queryString ? `?${queryString}` : ''}`,
  );
}
