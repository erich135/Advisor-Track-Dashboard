/**
 * Task 16: customer vs platform sidebar structure, role visibility, route preservation.
 * Run: npm run test:navigation
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import type { AuthSession } from '../src/lib/useAuth';
import {
  buildCustomerNav,
  buildPlatformNav,
  flattenNavTos,
  navItemIsActive,
} from '../src/lib/portalNavigation';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

function session(partial: {
  rank?: 'executive' | 'regional_manager' | 'team_leader' | 'financial_advisor' | 'platform_admin';
  portalAccess?: boolean;
  isOrganisationAdmin?: boolean;
  isPlatformAdmin?: boolean;
  canViewRegions?: boolean;
  canViewTeams?: boolean;
  permissions?: string[];
}): AuthSession {
  const rank = partial.rank ?? 'executive';
  return {
    isPlatformAdmin: Boolean(partial.isPlatformAdmin),
    isOrganisationAdmin: Boolean(partial.isOrganisationAdmin),
    permissions: partial.permissions ?? [],
    hierarchy: {
      rank,
      label: rank,
      comparisonRank: null,
      comparisonRoleLabel: null,
      portalAccess: partial.portalAccess ?? rank !== 'financial_advisor',
      scopeKind: rank === 'executive' ? 'organisation' : rank === 'regional_manager' ? 'region' : 'team',
      structureAccess: {
        canViewRegions: Boolean(partial.canViewRegions),
        canManageRegions: Boolean(partial.canViewRegions),
        canViewTeams: Boolean(partial.canViewTeams),
        canManageTeams: Boolean(partial.canViewTeams),
      },
    },
  } as AuthSession;
}

function labels(sections: ReturnType<typeof buildCustomerNav>): string[] {
  return sections.flatMap((section) => [section.label, ...section.items.map((item) => item.label)]);
}

function itemLabels(sections: ReturnType<typeof buildCustomerNav>): string[] {
  return sections.flatMap((section) => section.items.map((item) => item.label));
}

function assertNoDuplicates(sections: ReturnType<typeof buildCustomerNav>, label: string) {
  const tos = flattenNavTos(sections);
  assert.equal(tos.length, new Set(tos).size, `${label} has duplicate routes: ${tos.join(', ')}`);
}

const exec = session({
  rank: 'executive',
  isOrganisationAdmin: true,
  canViewRegions: true,
  canViewTeams: true,
});
const rm = session({ rank: 'regional_manager', canViewRegions: true, canViewTeams: true });
const tl = session({ rank: 'team_leader', canViewTeams: true });
const orgAdminFa = session({
  rank: 'financial_advisor',
  portalAccess: false,
  isOrganisationAdmin: true,
});
const fa = session({ rank: 'financial_advisor', portalAccess: false });
const platform = session({ rank: 'executive', isPlatformAdmin: true, canViewRegions: true, canViewTeams: true });

const execNav = buildCustomerNav(exec, 'production');
const rmNav = buildCustomerNav(rm, 'production');
const tlNav = buildCustomerNav(tl, 'production');
const orgAdminNav = buildCustomerNav(orgAdminFa, 'production');
const faNav = buildCustomerNav(fa, 'production');
const platformNav = buildPlatformNav(platform);

assertNoDuplicates(execNav, 'executive');
assertNoDuplicates(rmNav, 'rm');
assertNoDuplicates(tlNav, 'tl');
assertNoDuplicates(orgAdminNav, 'org-admin-fa');
assertNoDuplicates(faNav, 'fa');
assertNoDuplicates(platformNav, 'platform');

assert.deepEqual(
  execNav.map((section) => section.id),
  ['overview', 'organisation', 'account'],
);
assert.deepEqual(itemLabels(execNav.filter((section) => section.id === 'overview')), [
  'Dashboard',
  'Team Pipeline',
  'Advisors',
  'Production',
]);
assert.deepEqual(itemLabels(execNav.filter((section) => section.id === 'organisation')), [
  'Users & Access',
  'Regions & Teams',
  'Licences',
  'Settings & Roles',
]);
assert.deepEqual(itemLabels(execNav.filter((section) => section.id === 'account')), [
  'Invoices',
]);
assert.equal(labels(execNav).includes('Performance'), false);
assert.equal(labels(execNav).includes('Audit'), false);
assert.equal(labels(execNav).includes('Enterprise Customers'), false);
assert.equal(flattenNavTos(execNav).includes('/enterprise-customers'), false);
assert.equal(flattenNavTos(execNav).includes('/licence-requests'), false);
assert.equal(flattenNavTos(execNav).includes('/engineering/changelog'), false);
assert.equal(flattenNavTos(execNav).includes('/subscriptions'), false);

const rmItems = itemLabels(rmNav);
assert.ok(rmItems.includes('Users & Access'));
assert.ok(rmItems.includes('Licences'));
assert.ok(rmItems.includes('Regions & Teams'));
assert.equal(rmItems.includes('Subscription'), false);
assert.equal(rmItems.includes('Invoices'), false);
assert.equal(rmItems.includes('Bulk Import'), false);
assert.equal(rmItems.includes('Settings & Roles'), false);
assert.ok(rmNav.some((section) => section.id === 'overview' && section.items.length === 4));

const tlItems = itemLabels(tlNav);
assert.ok(tlItems.includes('Users & Access'));
assert.ok(tlItems.includes('Licences'));
assert.equal(tlItems.includes('Regions & Teams'), false);
assert.equal(tlItems.includes('Subscription'), false);
assert.equal(tlItems.includes('Invoices'), false);
assert.equal(tlItems.includes('Settings & Roles'), false);

const orgItems = itemLabels(orgAdminNav);
assert.deepEqual(
  orgAdminNav.find((section) => section.id === 'overview')?.items.map((item) => item.to),
  ['/'],
);
assert.ok(orgItems.includes('Users & Access'));
assert.ok(orgItems.includes('Licences'));
assert.equal(orgItems.includes('Bulk Import'), false);
assert.equal(orgItems.includes('Subscription'), false);
assert.ok(orgItems.includes('Invoices'));
assert.equal(orgItems.includes('Team Pipeline'), false);
assert.equal(orgItems.includes('Performance'), false);
assert.equal(orgItems.includes('Settings & Roles'), false);

const faItems = itemLabels(faNav);
assert.deepEqual(faItems, ['Dashboard']);
assert.equal(faNav.length, 1);

const platformTos = flattenNavTos(platformNav);
assert.equal(platformTos.includes('/enterprise-customers'), false);
assert.equal(platformTos.includes('/licence-requests'), false);
assert.ok(platformTos.includes('/companies'));
assert.ok(platformTos.includes('/subscriptions'));
assert.ok(platformTos.includes('/performance'));
assert.ok(platformTos.includes('/audit'));
assert.equal(platformNav.some((section) => section.label === 'Platform / Internal'), false);
assert.equal(platformNav.some((section) => section.items.some((item) => item.label === 'Enterprise Customers')), false);
assert.equal(platformNav.some((section) => section.items.some((item) => item.label === 'Licence Requests')), false);

const usersItem = { to: '/users', label: 'Users & Access', highlight: 'users' as const };
const regionsItem = { to: '/users?tab=regions', label: 'Regions & Teams', highlight: 'regions' as const };
assert.equal(navItemIsActive(usersItem, '/users', ''), true);
assert.equal(navItemIsActive(usersItem, '/users', '?tab=regions'), false);
assert.equal(navItemIsActive(regionsItem, '/users', '?tab=regions'), true);
assert.equal(navItemIsActive(regionsItem, '/users', '?tab=teams'), true);
assert.equal(navItemIsActive(regionsItem, '/users', ''), false);
assert.equal(navItemIsActive({ to: '/', label: 'Dashboard' }, '/', ''), true);
assert.equal(navItemIsActive({ to: '/', label: 'Dashboard' }, '/advisors', ''), false);
assert.equal(navItemIsActive({ to: '/subscription', label: 'Subscription' }, '/subscriptions', ''), false);
assert.equal(navItemIsActive({ to: '/subscription', label: 'Subscription' }, '/subscription', ''), true);

const layout = src('src/components/Layout.tsx');
assert.match(layout, /buildCustomerNav\(session, 'production'\)/);
assert.match(layout, /buildPlatformNav/);
assert.match(layout, /navItemIsActive/);
assert.match(layout, /CompanyContextMark/);
assert.doesNotMatch(layout, /customerBusinessNav/);
assert.doesNotMatch(layout, /<select[^>]*company/i);

const portalNav = src('src/lib/portalNavigation.ts');
assert.match(portalNav, /Platform \/ Internal/);
assert.match(portalNav, /Enterprise Customers/);
assert.match(portalNav, /Licence Requests/);

const app = src('src/App.tsx');
for (const route of [
  '/',
  '/team-pipeline',
  '/advisors',
  '/production',
  '/users',
  '/licences',
  '/bulk-import',
  '/subscription',
  '/invoices',
  '/settings',
  '/companies',
  '/subscriptions',
  '/performance',
  '/audit',
  '/enterprise-customers',
  '/licence-requests',
  '/engineering/changelog',
]) {
  if (route === '/') {
    assert.match(app, /path="\/"/);
  } else {
    assert.match(app, new RegExp(`path="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
}

const usersPage = src('src/pages/UsersPage.tsx');
assert.match(usersPage, /parseUsersTab/);
assert.match(usersPage, /selectTab\('regions'\)/);
assert.match(usersPage, /tab=regions|set\('tab'/);

console.log('Production navigation checks passed');
