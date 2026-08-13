import { apiRequest } from './apiClient';

export type PlatformCompany = {
  id: string;
  name: string;
  slug?: string;
  seatLimit?: number | null;
  isPlatform?: boolean;
  isActive?: boolean;
  memberCount?: number;
  createdAt?: string;
};

/** Platform admin: list every company. */
export async function getPlatformCompanies(): Promise<PlatformCompany[]> {
  return apiRequest<PlatformCompany[]>('/platform/companies');
}
