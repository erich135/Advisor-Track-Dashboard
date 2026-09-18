/**
 * Task 11: customer-facing enterprise subscription summary + internal contract editor.
 * Run: npm run test:enterprise-contract
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVISORTRACK_VAT_REGISTERED, sellerChargesVat } from '../src/lib/advisortrackVat';
import { canViewCompanySubscription } from '../src/lib/portalAccess';
import type { AuthSession } from '../src/lib/useAuth';
import { DEFAULT_VAT_RATE_PERCENT } from '../src/lib/invoiceMoney';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(ADVISORTRACK_VAT_REGISTERED, false);
assert.equal(sellerChargesVat(), false);
assert.equal(DEFAULT_VAT_RATE_PERCENT, '0.00');

assert.equal(
  canViewCompanySubscription({
    isPlatformAdmin: false,
    isOrganisationAdmin: true,
    permissions: [],
    hierarchy: { portalAccess: false, rank: 'financial_advisor' },
  } as AuthSession),
  true
);
assert.equal(
  canViewCompanySubscription({
    isPlatformAdmin: false,
    isOrganisationAdmin: false,
    permissions: [],
    hierarchy: { portalAccess: true, rank: 'team_leader' },
  } as AuthSession),
  false
);

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.match(app, /path="\/subscription"/);
assert.match(app, /RequireCompanySubscription[\s\S]*CompanySubscriptionPage/);
assert.match(app, /canViewCompanySubscription/);

const layout = fs.readFileSync(path.join(root, 'src/components/Layout.tsx'), 'utf8');
assert.match(layout, /\/subscription/);
assert.match(layout, /Subscription/);

const page = fs.readFileSync(path.join(root, 'src/pages/CompanySubscriptionPage.tsx'), 'utf8');
assert.match(page, /getCompanySubscription/);
assert.doesNotMatch(page, /patchEnterpriseContract/);
assert.doesNotMatch(page, /internalNotes/);
assert.doesNotMatch(page, /method:\s*'PATCH'/);

const summary = fs.readFileSync(path.join(root, 'src/components/CompanySubscriptionSummary.tsx'), 'utf8');
assert.match(summary, /committed/);
assert.match(summary, /currently purchased/);
assert.match(summary, /cannot be changed from the customer portal/);
assert.doesNotMatch(summary, /internalNotes/);
assert.doesNotMatch(summary, /Discount rationale/);

const wizard = fs.readFileSync(path.join(root, 'src/pages/EnterpriseCustomerOnboardingPage.tsx'), 'utf8');
assert.match(wizard, /Committed licences/);
assert.match(wizard, /Current purchased licences/);
assert.match(wizard, /Internal commercial notes \(hidden from customers\)/);
assert.match(wizard, /Billing notes \(customer-visible\)/);
assert.match(wizard, /Additional seat billing/);
assert.match(wizard, /Seat reductions/);
assert.match(wizard, /not VAT registered/);

const invoiceDoc = fs.readFileSync(path.join(root, 'src/components/InvoiceDocument.tsx'), 'utf8');
assert.match(invoiceDoc, /sellerChargesVat/);
assert.match(invoiceDoc, /Total due/);

const companyApi = fs.readFileSync(path.join(root, 'src/api/companyApi.ts'), 'utf8');
assert.match(companyApi, /\/company\/subscription/);
assert.doesNotMatch(companyApi, /method: 'PATCH'[\s\S]{0,80}\/company\/subscription/);

console.log('Enterprise contract frontend checks passed');
