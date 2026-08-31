import type { CompanyMember } from '../api/companyApi';

export const isFinancialAdvisor = (member: CompanyMember): boolean => {
  if (member.isPlatformAdmin) return false;
  if (member.rank) return member.rank === 'financial_advisor';
  const role = (member.role?.name ?? '').trim().toLowerCase();
  return role === 'advisor' || role === 'financial advisor';
};

export const financialAdvisorsInScope = (members: CompanyMember[] | undefined): CompanyMember[] =>
  (members ?? []).filter(isFinancialAdvisor);

export const memberDisplayName = (member: Pick<CompanyMember, 'firstName' | 'lastName' | 'email'>): string => {
  const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
  return name || member.email;
};
