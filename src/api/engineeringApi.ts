import { apiRequest } from './apiClient';

export type EngineeringEntry = {
  id: string;
  entryType: 'change' | 'deployment' | 'decision' | 'correction';
  createdAt: string;
  createdByUserId: string | null;
  authorName: string;
  repository: string;
  branch: string | null;
  commitHash: string | null;
  environment: string | null;
  area: string | null;
  changeType: string | null;
  summary: string;
  reason: string | null;
  affectedFiles: string[];
  migrationRefs: string[];
  compatibilityNotes: string | null;
  risksDependencies: string | null;
  tests: string | null;
  relatedEntryId: string | null;
  supersedesEntryId: string | null;
  isPinned: boolean;
};

export type EngineeringChangelogList = {
  entries: EngineeringEntry[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateEngineeringEntryInput = {
  entryType: EngineeringEntry['entryType'];
  repository: string;
  summary: string;
  changeType?: string;
  branch?: string;
  commitHash?: string;
  environment?: string;
  area?: string;
  reason?: string;
  affectedFiles?: string[];
  migrationRefs?: string[];
  compatibilityNotes?: string;
  risksDependencies?: string;
  tests?: string;
  relatedEntryId?: string;
  supersedesEntryId?: string;
  isPinned?: boolean;
};

export async function listEngineeringChangelog(filters?: {
  repository?: string;
  area?: string;
  environment?: string;
  entryType?: string;
  changeType?: string;
  author?: string;
  createdFrom?: string;
}): Promise<EngineeringChangelogList> {
  const params = new URLSearchParams();
  if (filters?.repository) params.set('repository', filters.repository);
  if (filters?.area) params.set('area', filters.area);
  if (filters?.environment) params.set('environment', filters.environment);
  if (filters?.entryType) params.set('entryType', filters.entryType);
  if (filters?.changeType) params.set('changeType', filters.changeType);
  if (filters?.author) params.set('author', filters.author);
  if (filters?.createdFrom) params.set('createdFrom', filters.createdFrom);
  const query = params.toString();
  return apiRequest<EngineeringChangelogList>(`/platform/engineering/changelog${query ? `?${query}` : ''}`);
}

export async function listEngineeringDecisions(): Promise<{ decisions: EngineeringEntry[] }> {
  return apiRequest<{ decisions: EngineeringEntry[] }>('/platform/engineering/decisions');
}

export async function createEngineeringEntry(input: CreateEngineeringEntryInput): Promise<EngineeringEntry> {
  return apiRequest<EngineeringEntry>('/platform/engineering/changelog', {
    method: 'POST',
    body: input,
  });
}
