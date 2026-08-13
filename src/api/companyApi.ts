import { apiRequest } from './apiClient';
import type { Organisation } from './authApi';

export type CompanyRole = {
  id: string;
  name: string;
};

export type CompanyMe = {
  company: Organisation;
  role: CompanyRole | null;
  permissions: string[];
  reportsToUserId: string | null;
  isPlatformAdmin: boolean;
};

export type CompanyMemberSubscription = {
  slug: string;
  name: string;
  status: string;
};

export type CompanyMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: CompanyRole | null;
  reportsToUserId: string | null;
  isPlatformAdmin: boolean;
  subscription: CompanyMemberSubscription | null;
  createdAt: string;
};

export type CompanyMemberDetail = CompanyMember & {
  phone?: string;
  company: Organisation;
  isActive: boolean;
  lastLoginAt?: string;
};

export type CompanyRoleDetail = {
  id: string;
  name: string;
  isDefault?: boolean;
  isSystem?: boolean;
  permissions: string[];
  createdAt?: string;
};

export async function getCompanyMe(): Promise<CompanyMe> {
  return apiRequest<CompanyMe>('/company/me');
}

/** Role-scoped member list for the signed-in user's company. */
export async function getCompanyMembers(): Promise<CompanyMember[]> {
  return apiRequest<CompanyMember[]>('/company/members');
}

/** One member visible within the signed-in user's management scope. */
export async function getCompanyMember(memberId: string): Promise<CompanyMemberDetail> {
  return apiRequest<CompanyMemberDetail>(`/company/members/${encodeURIComponent(memberId)}`);
}

/** Roles + permission keys for the signed-in user's company. */
export async function getCompanyRoles(): Promise<CompanyRoleDetail[]> {
  return apiRequest<CompanyRoleDetail[]>('/company/roles');
}

export type CompanyPermission = {
  key: string;
  label?: string;
  description?: string;
};

/** Fixed organisation permission catalogue. */
export async function getCompanyPermissions(): Promise<CompanyPermission[]> {
  return apiRequest<CompanyPermission[]>('/company/permissions');
}
