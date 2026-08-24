import type { AuthSession } from './useAuth';

export function hasLeadershipPortalAccess(session: AuthSession | null): boolean {
  if (!session) return false;
  if (session.isPlatformAdmin) return true;
  if (session.hierarchy) return session.hierarchy.portalAccess;
  return true;
}

export function isCustomerExecutive(session: AuthSession | null): boolean {
  return session?.hierarchy?.rank === 'executive';
}

export function isCustomerPeopleManager(session: AuthSession | null): boolean {
  const rank = session?.hierarchy?.rank;
  return rank === 'executive' || rank === 'regional_manager' || rank === 'team_leader';
}
