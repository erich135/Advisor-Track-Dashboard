/**
 * Internal enterprise onboarding: platform-admin only, separate commercial/invoice state.
 * Run: npm run test:enterprise-onboarding
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildInvoicePreviewLines,
  COMMERCIAL_STATUSES,
  randsToCents,
} from '../src/lib/enterpriseOnboarding';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const perSeat = buildInvoicePreviewLines({
  companyName: 'Momentum',
  purchasedLicences: 1000,
  billingModel: 'monthly',
  pricingType: 'per_seat',
  negotiatedAmountCents: 12500,
});
assert.equal(perSeat[0].quantity, 1000);
assert.equal(perSeat[0].unitPriceCents, 12500);

const custom = buildInvoicePreviewLines({
  companyName: 'Sanlam',
  purchasedLicences: 400,
  billingModel: 'custom',
  pricingType: 'custom',
  negotiatedAmountCents: 8800000,
});
assert.equal(custom[0].quantity, 1);
assert.equal(randsToCents('150.50'), 15050);

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.match(app, /path="\/enterprise-customers"/);
assert.match(app, /path="\/enterprise-customers\/:onboardingId"/);
assert.match(app, /RequirePlatform[\s\S]*EnterpriseCustomersPage/);
assert.match(app, /RequirePlatform[\s\S]*EnterpriseCustomerOnboardingPage/);

function gateBody(name: string): string {
  const match = app.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`));
  assert.ok(match, `expected ${name}`);
  return match[0];
}
const platform = gateBody('RequirePlatform');
assert.match(platform, /isPlatformAdmin/);
assert.match(platform, /PermissionDenied/);
assert.doesNotMatch(platform, /hierarchy/);

const layout = fs.readFileSync(path.join(root, 'src/components/Layout.tsx'), 'utf8');
assert.match(layout, /buildPlatformNav/);
assert.match(layout, /enterprise-customers/);
assert.match(layout, /buildCustomerNav\(session, 'production'\)/);
const portalNav = fs.readFileSync(path.join(root, 'src/lib/portalNavigation.ts'), 'utf8');
assert.match(portalNav, /Platform \/ Internal/);
const customerFn = portalNav.slice(
  portalNav.indexOf('export function buildCustomerNav'),
  portalNav.indexOf('export function buildPlatformNav'),
);
assert.doesNotMatch(customerFn, /enterprise-customers/);

const wizard = fs.readFileSync(path.join(root, 'src/pages/EnterpriseCustomerOnboardingPage.tsx'), 'utf8');
assert.doesNotMatch(wizard, /type="password"/);
assert.doesNotMatch(wizard, /sendPlatformInvoice/);
assert.doesNotMatch(wizard, /resendPlatformCustomerInvitation/);
assert.match(wizard, /Queue org admin invite locally/);
assert.match(wizard, /Create draft invoice/);
assert.match(wizard, /hierarchyRoleNotRequired|reporting-hierarchy role/);
assert.ok(COMMERCIAL_STATUSES.includes('lead'));
assert.ok(COMMERCIAL_STATUSES.includes('onboarding'));
assert.match(wizard, /Commercial status/);
assert.match(wizard, /Invoice:/);

const list = fs.readFileSync(path.join(root, 'src/pages/EnterpriseCustomersPage.tsx'), 'utf8');
assert.match(list, /Not customer-facing/);
assert.match(list, /is_platform_admin/);

console.log('Enterprise onboarding frontend checks passed');
