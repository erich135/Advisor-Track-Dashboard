import assert from 'node:assert/strict';
import { isFinancialAdvisor } from '../src/lib/financialAdvisors';
import { pipelineProgressLabel, pipelineProgressStates } from '../src/lib/pipelineProgress';
import { readPipelineQuery, teamPipelinePath, writePipelineQuery } from '../src/lib/pipelineQuery';
import { advisorDetailsPath, parsePipelineReturnPath } from '../src/lib/pipelineReturnPath';
import type { CompanyMember } from '../src/api/companyApi';

const advisor = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Ian',
  lastName: 'Baker',
  email: 'ian@example.test',
  role: { id: 'role', name: 'Advisor' },
  reportsToUserId: null,
  isPlatformAdmin: false,
  isActive: true,
  subscription: null,
  licenceStatus: 'Licensed',
  accountStatus: 'Active',
  rank: 'financial_advisor',
  createdAt: '2026-01-01T00:00:00.000Z',
} as CompanyMember;

assert.equal(isFinancialAdvisor(advisor), true);
assert.equal(
  isFinancialAdvisor({ ...advisor, rank: 'team_leader', role: { id: 'x', name: 'Team Leader' } }),
  false
);
assert.equal(
  isFinancialAdvisor({ ...advisor, rank: 'executive', role: { id: 'x', name: 'Financial Advisor' } }),
  false
);
assert.equal(isFinancialAdvisor({ ...advisor, isPlatformAdmin: true }), false);

const params = writePipelineQuery({
  advisor: advisor.id,
  stage: 'Implementation',
  status: 'open',
  search: 'smith',
});
assert.equal(params.get('advisor'), advisor.id);
assert.equal(readPipelineQuery(params).stage, 'Implementation');
assert.equal(
  teamPipelinePath({ advisor: advisor.id, stage: 'Implementation', status: 'open', search: 'smith' }),
  `/team-pipeline?advisor=${advisor.id}&stage=Implementation&status=open&search=smith`
);

const returnPath = `/team-pipeline?advisor=${advisor.id}&stage=Implementation`;
assert.equal(parsePipelineReturnPath(returnPath), returnPath);
assert.equal(parsePipelineReturnPath('/advisors'), null);
assert.equal(parsePipelineReturnPath('https://evil.example/team-pipeline'), null);
assert.equal(parsePipelineReturnPath('//evil.example/team-pipeline'), null);
assert.equal(parsePipelineReturnPath('javascript:alert(1)'), null);
assert.equal(parsePipelineReturnPath('/team-pipeline/extra'), null);
assert.equal(
  advisorDetailsPath(advisor.id, returnPath),
  `/advisors/${advisor.id}?return=${encodeURIComponent(returnPath)}`
);
assert.equal(advisorDetailsPath(advisor.id, '/advisors'), `/advisors/${advisor.id}`);

assert.deepEqual(pipelineProgressStates('Recommendation'), [
  'complete',
  'complete',
  'complete',
  'current',
  'future',
  'future',
]);
assert.match(pipelineProgressLabel('Recommendation'), /stage 4 of 6/);

console.log('Frontend pipeline drilldown unit checks passed');
