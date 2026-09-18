/**
 * Permission-denied UX: leadership/platform/executive gates show a friendly
 * frontend state instead of silently redirecting to Dashboard.
 * Run: npm run test:permission-denied
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const denied = fs.readFileSync(path.join(root, 'src/components/PermissionDenied.tsx'), 'utf8');

assert.match(denied, /You don’t have access to this feature/);
assert.match(denied, /Your current role does not have permission to view this area/);
assert.match(denied, /Back to Dashboard/);
assert.match(denied, /className="btn primary"/);
assert.match(denied, /to="\/"/);
assert.doesNotMatch(denied, /Reset Demo|Viewing as|isPublicDemo|AUDIT_PERMISSION_DENIED/);

function gateBody(name: string): string {
  const match = app.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`));
  assert.ok(match, `expected ${name} gate in App.tsx`);
  return match[0];
}

const leadership = gateBody('RequireLeadership');
assert.match(leadership, /hasLeadershipPortalAccess/);
assert.match(leadership, /<PermissionDenied \/>/);
assert.doesNotMatch(leadership, /Navigate to="\/"/);

const platform = gateBody('RequirePlatform');
assert.match(platform, /isPlatformAdmin/);
assert.match(platform, /<PermissionDenied \/>/);
assert.doesNotMatch(platform, /Navigate to="\/"/);
assert.doesNotMatch(platform, /isPublicDemo/);

const executive = gateBody('RequireExecutive');
assert.match(executive, /isCustomerExecutive/);
assert.match(executive, /isPlatformAdmin/);
assert.match(executive, /<PermissionDenied \/>/);
assert.doesNotMatch(executive, /Navigate to="\/"/);

const changelog = gateBody('RequireEngineeringChangelog');
assert.match(changelog, /canAccessEngineeringChangelog/);
assert.match(changelog, /<PermissionDenied \/>/);

assert.match(app, /path="\/subscriptions"/);
assert.match(app, /RequirePlatform>\s*\n\s*<SubscriptionsPage/);
assert.match(app, /path="\/audit"/);
assert.match(app, /RequirePlatform>\s*\n\s*<AuditPage/);
assert.match(app, /path="\/performance"/);
assert.match(app, /RequirePlatform>\s*\n\s*<PerformancePage/);
assert.doesNotMatch(app, /RequireAuditViewer/);

console.log('Permission-denied UX checks passed');
