import { ShieldCheck, Check, Lock, Database, Server } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, SkeletonRows, PageIntro } from '../components/ui';
import type { Role } from '../domain/types';

const roleMatrix: { capability: string; roles: Record<Role, boolean> }[] = [
  { capability: 'View own activity & targets', roles: { SuperAdmin: true, CompanyAdmin: true, TeamManager: true, Advisor: true } },
  { capability: 'View team members', roles: { SuperAdmin: true, CompanyAdmin: true, TeamManager: true, Advisor: false } },
  { capability: 'View whole company', roles: { SuperAdmin: true, CompanyAdmin: true, TeamManager: false, Advisor: false } },
  { capability: 'Manage company licenses', roles: { SuperAdmin: true, CompanyAdmin: true, TeamManager: false, Advisor: false } },
  { capability: 'Issue invoices', roles: { SuperAdmin: true, CompanyAdmin: false, TeamManager: false, Advisor: false } },
  { capability: 'Handle support tickets', roles: { SuperAdmin: true, CompanyAdmin: false, TeamManager: false, Advisor: false } },
  { capability: 'View all companies & platform revenue', roles: { SuperAdmin: true, CompanyAdmin: false, TeamManager: false, Advisor: false } },
  { capability: 'Manage roles & permissions', roles: { SuperAdmin: true, CompanyAdmin: false, TeamManager: false, Advisor: false } },
];

const roleOrder: Role[] = ['SuperAdmin', 'CompanyAdmin', 'TeamManager', 'Advisor'];
const roleLabels: Record<Role, string> = {
  SuperAdmin: 'Super Admin',
  CompanyAdmin: 'Company Admin',
  TeamManager: 'Team Manager',
  Advisor: 'Advisor',
};

export default function SettingsPage() {
  const usersA = useAsync(() => db.getUsers());
  if (!usersA.data) return <SkeletonRows rows={4} cols={3} />;

  return (
    <>
      <PageIntro>
        v1 is internal — you, Johan and Abel all have full Super Admin access. The role tiers below
        are already modelled so company/team permissions can switch on when corporate clients arrive.
      </PageIntro>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Team members</h3>
            <span className="hint">Creation team · full access</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Member</th><th>Email</th><th>Role</th></tr>
              </thead>
              <tbody>
                {usersA.data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="cell-user">
                        <Avatar name={u.name} color={u.avatarColor} />
                        <span className="nm">{u.name}{u.isFounder && <span className="subtle" style={{ fontWeight: 400 }}> · Founder</span>}</span>
                      </span>
                    </td>
                    <td className="muted">{u.email}</td>
                    <td><Pill tone="purple"><ShieldCheck size={12} /> {roleLabels[u.role]}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Backend connection</h3>
            <span className="hint">Data source</span>
          </div>
          <div className="card-pad stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 12 }}>
              <span className="stat-top icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}>
                <Database size={18} />
              </span>
              <div className="stack" style={{ gap: 1 }}>
                <strong>Seed data (local)</strong>
                <span className="muted" style={{ fontSize: 12.5 }}>Currently active · in-memory demo data</span>
              </div>
              <div style={{ flex: 1 }} />
              <Pill tone="amber">Active</Pill>
            </div>
            <div className="row" style={{ gap: 12, opacity: 0.6 }}>
              <span className="icon" style={{ background: 'var(--brand-soft)', color: 'var(--brand)', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}>
                <Server size={18} />
              </span>
              <div className="stack" style={{ gap: 1 }}>
                <strong>AWS API (PostgreSQL)</strong>
                <span className="muted" style={{ fontSize: 12.5 }}>Swap in via the DataService interface when Abel ships it</span>
              </div>
              <div style={{ flex: 1 }} />
              <Pill tone="grey">Pending</Pill>
            </div>
            <p className="subtle" style={{ fontSize: 12.5, margin: 0 }}>
              All pages read through a single <code>DataService</code> seam — connecting the real backend
              is a one-file change with no UI rework.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Permission matrix</h3>
          <span className="hint"><Lock size={13} /> Roadmap for company/team tiers</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Capability</th>
                {roleOrder.map((r) => (
                  <th key={r} style={{ textAlign: 'center' }}>{roleLabels[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roleMatrix.map((row) => (
                <tr key={row.capability}>
                  <td style={{ fontWeight: 500 }}>{row.capability}</td>
                  {roleOrder.map((r) => (
                    <td key={r} style={{ textAlign: 'center' }}>
                      {row.roles[r] ? (
                        <Check size={16} color="var(--green)" />
                      ) : (
                        <span className="subtle">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
