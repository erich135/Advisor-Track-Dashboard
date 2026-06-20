import { useState, useMemo } from 'react';
import { UserPlus, X, Building2, Users } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, SkeletonRows, PageIntro, StatCard } from '../components/ui';
import { formatDate } from '../lib/format';
import type { ManagedUser } from '../domain/types';

const roleLabels: Record<ManagedUser['role'], string> = {
  CompanyAdmin: 'Company Admin',
  TeamManager: 'Team Manager',
};
const roleTone: Record<ManagedUser['role'], string> = {
  CompanyAdmin: 'purple',
  TeamManager: 'blue',
};

export default function UsersPage() {
  const managed = useAsync(() => db.getManagedUsers());
  const companies = useAsync(() => db.getCompanies());
  const teams = useAsync(() => db.getTeams());
  const [showModal, setShowModal] = useState(false);
  const [localUsers, setLocalUsers] = useState<ManagedUser[] | null>(null);

  const list = localUsers ?? managed.data ?? [];

  const companyMap = useMemo(() => new Map(companies.data?.map((c) => [c.id, c]) ?? []), [companies.data]);
  const teamMap = useMemo(() => new Map(teams.data?.map((t) => [t.id, t]) ?? []), [teams.data]);

  if (!managed.data || !companies.data || !teams.data) return <SkeletonRows rows={6} cols={4} />;

  const admins = list.filter((u) => u.role === 'CompanyAdmin');
  const managers = list.filter((u) => u.role === 'TeamManager');

  function handleAdd(user: ManagedUser) {
    setLocalUsers([...list, user]);
    setShowModal(false);
  }

  return (
    <>
      <PageIntro>
        Manage CompanyAdmin and TeamManager access. Founders (Super Admins) are on the Settings page.
      </PageIntro>

      <div className="grid grid-3">
        <StatCard label="Company Admins" value={admins.length} icon={<Building2 size={18} />} iconBg="var(--purple-soft)" iconColor="var(--purple)" />
        <StatCard label="Team Managers" value={managers.length} icon={<Users size={18} />} iconBg="var(--brand-soft)" iconColor="var(--brand)" />
        <StatCard label="Companies with admin" value={new Set(list.map((u) => u.companyId)).size} icon={<Building2 size={18} />} iconBg="var(--green-soft)" iconColor="var(--green)" />
      </div>

      <div className="row between" style={{ margin: '20px 0 14px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>All managed users</h3>
        <button className="btn primary" onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Add user
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Company</th>
                <th>Team</th>
                <th>Added</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="cell-user">
                      <Avatar name={u.name} color={u.avatarColor} />
                      <div>
                        <div className="nm">{u.name}</div>
                        <div className="sm">{u.email}</div>
                      </div>
                    </span>
                  </td>
                  <td><Pill tone={roleTone[u.role]}>{roleLabels[u.role]}</Pill></td>
                  <td>{companyMap.get(u.companyId)?.name ?? u.companyId}</td>
                  <td>{u.teamId ? teamMap.get(u.teamId)?.name ?? u.teamId : <span className="subtle">—</span>}</td>
                  <td className="muted">{formatDate(u.createdAt)}</td>
                  <td><Pill tone={u.active ? 'green' : 'grey'}>{u.active ? 'Active' : 'Inactive'}</Pill></td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6}><div className="empty">No managed users yet — add one above.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AddUserModal
          companies={companies.data}
          teams={teams.data}
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ---- Add User modal ----
type FormState = {
  name: string;
  email: string;
  role: ManagedUser['role'];
  companyId: string;
  teamId: string;
};

function AddUserModal({
  companies,
  teams,
  onAdd,
  onClose,
}: {
  companies: { id: string; name: string }[];
  teams: { id: string; name: string; companyId: string }[];
  onAdd: (user: ManagedUser) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    role: 'CompanyAdmin',
    companyId: companies[0]?.id ?? '',
    teamId: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const filteredTeams = teams.filter((t) => t.companyId === form.companyId);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.companyId) e.companyId = 'Select a company';
    if (form.role === 'TeamManager' && !form.teamId) e.teamId = 'Select a team for Team Manager';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const user = await db.addManagedUser({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        companyId: form.companyId,
        teamId: form.role === 'TeamManager' ? form.teamId || undefined : undefined,
        avatarColor: '#1f6feb',
        active: true,
      });
      onAdd(user);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="drawer"
        style={{ width: 'min(540px, 94vw)', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-bar">
          <button className="btn ghost sm" onClick={onClose}><X size={16} /></button>
          <strong style={{ fontSize: 15 }}>Add user</strong>
          <div style={{ flex: 1 }} />
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <p className="muted" style={{ margin: '0 0 20px', fontSize: 13 }}>
            Assign a Company Admin or Team Manager to a company or team. They will be
            able to view their team's activity — they cannot access revenue, invoices or
            platform settings.
          </p>

          {/* Role */}
          <div className="field">
            <label className="field-label">Role</label>
            <div className="wrap-gap" style={{ marginTop: 6 }}>
              {(['CompanyAdmin', 'TeamManager'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`btn sm ${form.role === r ? 'primary' : ''}`}
                  onClick={() => { set('role', r); set('teamId', ''); }}
                >
                  {roleLabels[r]}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
              {form.role === 'CompanyAdmin'
                ? 'Can see all advisors and teams within their company.'
                : 'Can see only the advisors in their assigned team.'}
            </div>
          </div>

          <div style={{ height: 16 }} />

          {/* Name */}
          <div className="field">
            <label className="field-label">Full name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input
              className="input"
              style={{ width: '100%', marginTop: 5 }}
              placeholder="e.g. Pieter van Wyk"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          <div style={{ height: 12 }} />

          {/* Email */}
          <div className="field">
            <label className="field-label">Email address <span style={{ color: 'var(--red)' }}>*</span></label>
            <input
              className="input"
              type="email"
              style={{ width: '100%', marginTop: 5 }}
              placeholder="e.g. pieter@company.co.za"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div style={{ height: 12 }} />

          {/* Company */}
          <div className="field">
            <label className="field-label">Company <span style={{ color: 'var(--red)' }}>*</span></label>
            <select
              className="input"
              style={{ width: '100%', marginTop: 5 }}
              value={form.companyId}
              onChange={(e) => { set('companyId', e.target.value); set('teamId', ''); }}
            >
              <option value="">— select company —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.companyId && <div className="field-error">{errors.companyId}</div>}
          </div>

          {/* Team — only for TeamManager */}
          {form.role === 'TeamManager' && (
            <>
              <div style={{ height: 12 }} />
              <div className="field">
                <label className="field-label">Team <span style={{ color: 'var(--red)' }}>*</span></label>
                <select
                  className="input"
                  style={{ width: '100%', marginTop: 5 }}
                  value={form.teamId}
                  onChange={(e) => set('teamId', e.target.value)}
                  disabled={!form.companyId}
                >
                  <option value="">— select team —</option>
                  {filteredTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.teamId && <div className="field-error">{errors.teamId}</div>}
                {form.companyId && filteredTeams.length === 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--amber)', marginTop: 5 }}>
                    No teams exist for this company yet.
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ height: 24 }} />
          <div className="row between">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={saving}>
              <UserPlus size={16} /> {saving ? 'Adding…' : 'Add user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
