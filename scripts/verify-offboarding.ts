/**
 * Task 14 offboarding frontend checks.
 * Run: npm run test:offboarding
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const users = fs.readFileSync(path.join(root, 'src/pages/UsersPage.tsx'), 'utf8');
const companyApi = fs.readFileSync(path.join(root, 'src/api/companyApi.ts'), 'utf8');

assert.match(users, /Deactivate User/);
assert.match(users, /Historical cases, production and activity records will be retained/);
assert.match(users, /This does not delete the user/);
assert.match(users, /No licence is currently assigned, so the licence pool will not change/);
assert.match(users, /Current licence pool/);
assert.match(users, /After deactivation/);
assert.match(users, /deactivateCompanyMember/);
assert.match(companyApi, /\/company\/members\/\$\{encodeURIComponent\(memberId\)\}\/deactivate/);
assert.doesNotMatch(users, /DELETE FROM users/);
assert.doesNotMatch(companyApi, /hard-delete/);

console.log('Offboarding frontend checks passed');
