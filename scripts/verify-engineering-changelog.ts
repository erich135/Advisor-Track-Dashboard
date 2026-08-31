import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const app = src('src/App.tsx');
assert.match(app, /RequireEngineeringChangelog/);
assert.match(app, /path="\/engineering\/changelog"/);
assert.match(app, /EngineeringChangelogPage/);
assert.match(app, /PermissionDenied/);
assert.match(app, /You don’t have access to this feature|PermissionDenied/);

const layout = src('src/components/Layout.tsx');
assert.match(layout, /canAccessEngineeringChangelog/);
assert.match(layout, /label: 'Change Log'/);
assert.match(layout, /Engineering/);

const page = src('src/pages/EngineeringChangelogPage.tsx');
assert.match(page, /Pinned Engineering Decisions/);
assert.match(page, /Add Change Entry/);
assert.match(page, /Add correction/);
assert.match(page, /Do not include credentials, tokens, keys or secrets/);
assert.doesNotMatch(page, /\bEdit\b.*entry/i);
assert.doesNotMatch(page, /Delete entry/);
assert.doesNotMatch(page, /onDelete/);

const permission = src('src/components/PermissionDenied.tsx');
assert.match(permission, /You don’t have access to this feature/);

const auth = src('src/lib/useAuth.ts');
assert.match(auth, /canAccessEngineeringChangelog/);

const company = src('src/api/companyApi.ts');
assert.match(company, /canAccessEngineeringChangelog/);

console.log('Frontend Engineering Change Log checks passed');
