import { useMemo, useState } from 'react';
import { UserPlus, X, Building2, Users } from 'lucide-react';
import { ApiError } from '../api/apiClient';
import {
  getCompanyMembers,
  getCompanyMe,
  getCompanyRoles,
  type CompanyMember,
  type CompanyRoleDetail,
} from '../api/companyApi';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../lib/useAuth';
import { Avatar, Pill, SkeletonRows, PageIntro, StatCard } from '../components/ui';
import { formatDate } from '../lib/format';
import type { ManagedUser } from '../domain/types';

const AVATAR_COLORS = ['#0E51E4', '#8957e5', '#2da44e', '#bf8700', '#cf222e', '#020921', '#1a7f37'];

function memberName(m: CompanyMember): string {
  return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email;
}

function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

type RoleBucket = 'admin' | 'manager' | 'other';

/**
 * Classify using Abel role permissions first, then role-name hints.
 * Company admin system role includes view_team, so admin is checked before manager.
 */
function classifyRole(role: CompanyRoleDetail | null | undefined): RoleBucket {
  if (!role) return 'other';
  const perms = role.permissions ?? [];
  const name = role.name.toLowerCase();

  if (
    perms.includes('manage_members') ||
    perms.includes('manage_roles') ||
    perms.includes('manage_company') ||
    /\bcompany\s*admin\b/.test(name)
  ) {
    return 'admin';
  }

  if (
    perms.includes('view_team') ||
    /\bteam\s*manager\b/.test(name) ||
    /\bteam\s*leader\b/.test(name) ||
    /\bsupervisor\b/.test(name)
  ) {
    return 'manager';
  }

  return 'other';
}

function statusLabel(m: CompanyMember): string | null {
  const status = m.subscription?.status?.trim();
  return status ? status : null;
}

type UsersPageData = {
  members: CompanyMember[];
  roles: CompanyRoleDetail[];
  companyName: string | null;
};

async function loadUsersPage(sessionCompanyName: string | null): Promise<UsersPageData> {
  const [members, roles, me] = await Promise.all([
    getCompanyMembers(),
    getCompanyRoles().catch(() => [] as CompanyRoleDetail[]),
    sessionCompanyName
      ? Promise.resolve(null)
      : getCompanyMe().catch(() => null),
  ]);

  return {
    members,
    roles,
    companyName: sessionCompanyName || me?.company?.name || null,
  };
}

export default function UsersPage() {
  const { session } = useAuth();
  const sessionCompanyName = session?.company?.name || session?.organisation?.name || null;
  const loaded = useAsync(() => loadUsersPage(sessionCompanyName), [sessionCompanyName]);

  const roleById = useMemo(() => {
    const map = new Map<string, CompanyRoleDetail>();
    loaded.data?.roles.forEach((r) => map.set(r.id, r));
    return map;
  }, [loaded.data?.roles]);

  const memberById = useMemo(() => {
    const map = new Map<string, CompanyMember>();
    loaded.data?.members.forEach((m) => map.set(m.id, m));
    return map;
  }, [loaded.data?.members]);

  const stats = useMemo(() => {
    const members = loaded.data?.members ?? [];
    let admins = 0;
    let managers = 0;
    for (const m of members) {
      const detail = m.role?.id ? roleById.get(m.role.id) : undefined;
      const bucket = classifyRole(
        detail ?? (m.role ? { id: m.role.id, name: m.role.name, permissions: [] } : null),
      );
      if (bucket === 'admin') admins += 1;
      else if (bucket === 'manager') managers += 1;
    }
    return { total: members.length, admins, managers };
  }, [loaded.data?.members, roleById]);

  if (loaded.loading && !loaded.data) {
    return <SkeletonRows rows={6} cols={4} />;
  }

  if (loaded.error && !loaded.data) {
    const message =
      loaded.error instanceof ApiError
        ? loaded.error.message
        : 'Unable to load users. Please try again.';
    return (
      <>
        <PageIntro>
          Manage company members and access. Founders (platform admins) are noted on the Settings page.
        </PageIntro>
        <div className="card">
          <div className="empty" style={{ color: 'var(--red)' }}>
            {message}
          </div>
        </div>
      </>
    );
  }

  const members = loaded.data?.members ?? [];
  const companyName = loaded.data?.companyName;

  return (
    <>
      <PageIntro>
        Manage company members and access. Founders (platform admins) are noted on the Settings page.
      </PageIntro>

      <div className="grid grid-3">
        <StatCard
          label="Total Members"
          value={stats.total}
          icon={<Users size={18} />}
          iconBg="var(--green-soft)"
          iconColor="var(--green)"
        />
        <StatCard
          label="Company Admins"
          value={stats.admins}
          icon={<Building2 size={18} />}
          iconBg="var(--purple-soft)"
          iconColor="var(--purple)"
        />
        <StatCard
          label="Team Managers"
          value={stats.managers}
          icon={<Users size={18} />}
          iconBg="var(--brand-soft)"
          iconColor="var(--brand)"
        />
      </div>

      <div className="row between" style={{ margin: '20px 0 14px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>All managed users</h3>
        <button
          className="btn primary"
          type="button"
          disabled
          title="Invite / add member is not available yet"
          style={{ opacity: 0.55, cursor: 'not-allowed' }}
        >
          <UserPlus size={16} /> Add user (coming soon)
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
              {members.map((m) => {
                const name = memberName(m);
                const manager = m.reportsToUserId ? memberById.get(m.reportsToUserId) : undefined;
                const status = statusLabel(m);
                return (
                  <tr key={m.id}>
                    <td>
                      <span className="cell-user">
                        <Avatar name={name} color={avatarColorFor(m.id)} />
                        <div>
                          <div className="nm">{name}</div>
                          <div className="sm">{m.email}</div>
                        </div>
                      </span>
                    </td>
                    <td>
                      {m.role?.name ? (
                        <Pill tone="blue">{m.role.name}</Pill>
                      ) : (
                        <span className="subtle">—</span>
                      )}
                    </td>
                    <td>{companyName ?? <span className="subtle">—</span>}</td>
                    <td>
                      {manager ? (
                        memberName(manager)
                      ) : (
                        <span className="subtle">—</span>
                      )}
                    </td>
                    <td className="muted">{m.createdAt ? formatDate(m.createdAt) : '—'}</td>
                    <td>
                      {status ? (
                        <Pill tone={status === 'active' ? 'green' : 'grey'}>{status}</Pill>
                      ) : (
                        <span className="subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">No members to show for your role yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---- Add User modal (kept for later invite wiring; not invoked) ----
type FormState = {
  name: string;
  email: string;
  role: ManagedUser['role'];
  companyId: string;
  teamId: string;
};

const roleLabels: Record<ManagedUser['role'], string> = {
  CompanyAdmin: 'Company Admin',
  TeamManager: 'Team Manager',
};

/** @deprecated Seed-backed modal retained until Abel invite exists. Not mounted. */
export function AddUserModal({
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
      // Intentionally does not call seedDataService — invite API not available.
      onAdd({
        id: 'pending',
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        companyId: form.companyId,
        teamId: form.role === 'TeamManager' ? form.teamId || undefined : undefined,
        avatarColor: '#0E51E4',
        createdAt: new Date().toISOString(),
        active: true,
      });
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
        <div className="drawer-bar">
          <button className="btn ghost sm" onClick={onClose}><X size={16} /></button>
          <strong style={{ fontSize: 15 }}>Add user</strong>
          <div style={{ flex: 1 }} />
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <p className="muted" style={{ margin: '0 0 20px', fontSize: 13 }}>
            Invite is not available yet. This form is retained for a future Abel invite API.
          </p>

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
          </div>

          <div style={{ height: 16 }} />

          <div className="field">
            <label className="field-label">Full name</label>
            <input
              className="input"
              style={{ width: '100%', marginTop: 5 }}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          <div style={{ height: 12 }} />

          <div className="field">
            <label className="field-label">Email address</label>
            <input
              className="input"
              type="email"
              style={{ width: '100%', marginTop: 5 }}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div style={{ height: 12 }} />

          <div className="field">
            <label className="field-label">Company</label>
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

          {form.role === 'TeamManager' && (
            <>
              <div style={{ height: 12 }} />
              <div className="field">
                <label className="field-label">Team</label>
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
              </div>
            </>
          )}

          <div style={{ height: 24 }} />
          <div className="row between">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled>
              <UserPlus size={16} /> {saving ? 'Adding…' : 'Add user (unavailable)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
