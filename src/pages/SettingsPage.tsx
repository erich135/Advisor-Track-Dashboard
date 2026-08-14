import { ShieldCheck, Check, Lock, Database, Server } from 'lucide-react';
import { ApiError, API_BASE_URL } from '../api/apiClient';
import {
  getCompanyMe,
  getCompanyMembers,
  getCompanyPermissions,
  getCompanyRoles,
  type CompanyMember,
  type CompanyMe,
  type CompanyPermission,
  type CompanyRoleDetail,
} from '../api/companyApi';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, SkeletonRows, PageIntro } from '../components/ui';

const AVATAR_COLORS = ['#0E51E4', '#8957e5', '#2da44e', '#bf8700', '#cf222e', '#020921', '#1a7f37'];

function memberName(m: CompanyMember): string {
  return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email;
}

function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function permissionLabel(p: CompanyPermission): string {
  return p.label?.trim() || p.key.replace(/_/g, ' ');
}

function isLocalBackend(): boolean {
  try {
    const host = new URL(API_BASE_URL).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return true;
  }
}

type SettingsPageData = {
  me: CompanyMe;
  members: CompanyMember[];
  roles: CompanyRoleDetail[];
  permissions: CompanyPermission[];
};

async function loadSettingsPage(): Promise<SettingsPageData> {
  const [me, members, roles, permissions] = await Promise.all([
    getCompanyMe(),
    getCompanyMembers(),
    getCompanyRoles(),
    getCompanyPermissions(),
  ]);
  return { me, members, roles, permissions };
}

export default function SettingsPage() {
  const loaded = useAsync(() => loadSettingsPage());

  if (loaded.loading && !loaded.data) {
    return <SkeletonRows rows={4} cols={3} />;
  }

  if (loaded.error && !loaded.data) {
    const message =
      loaded.error instanceof ApiError
        ? loaded.error.message
        : 'Unable to load settings. Please try again.';
    return (
      <>
        <PageIntro>
          Company access, roles, and permissions for your organisation.
        </PageIntro>
        <div className="card">
          <div className="empty" style={{ color: 'var(--red)' }}>
            {message}
          </div>
        </div>
      </>
    );
  }

  const me = loaded.data!.me;
  const members = loaded.data!.members;
  const roles = loaded.data!.roles;
  const permissions = loaded.data!.permissions;
  const companyName = me.company?.name ?? '—';
  const envLabel = isLocalBackend() ? 'Local development' : 'Connected API';

  return (
    <>
      <PageIntro>
        Company access, roles, and permissions for your organisation. This view is read-only.
      </PageIntro>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Team members</h3>
            <span className="hint">Company members in your access scope</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Member</th><th>Email</th><th>Role</th></tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const name = memberName(m);
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className="cell-user">
                          <Avatar name={name} color={avatarColorFor(m.id)} />
                          <span className="nm" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {name}
                            {m.isPlatformAdmin ? (
                              <Pill tone="purple">Platform Admin</Pill>
                            ) : null}
                          </span>
                        </span>
                      </td>
                      <td className="muted">{m.email}</td>
                      <td>
                        {m.role?.name ? (
                          <Pill tone="blue"><ShieldCheck size={12} /> {m.role.name}</Pill>
                        ) : (
                          <span className="subtle">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty">No members to show for your role yet.</div>
                    </td>
                  </tr>
                )}
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
              <span className="stat-top icon" style={{ background: 'var(--brand-soft)', color: 'var(--brand)', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}>
                <Server size={18} />
              </span>
              <div className="stack" style={{ gap: 1 }}>
                <strong>Abel API</strong>
                <span className="muted" style={{ fontSize: 12.5 }}>Company roles and permissions</span>
              </div>
              <div style={{ flex: 1 }} />
              <Pill tone="green">Active</Pill>
            </div>
            <div className="row" style={{ gap: 12 }}>
              <span className="icon" style={{ background: 'var(--green-soft)', color: 'var(--green)', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}>
                <Database size={18} />
              </span>
              <div className="stack" style={{ gap: 1 }}>
                <strong>Environment</strong>
                <span className="muted" style={{ fontSize: 12.5 }}>{envLabel}</span>
              </div>
            </div>
            <div className="row" style={{ gap: 12 }}>
              <span className="icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)', width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}>
                <ShieldCheck size={18} />
              </span>
              <div className="stack" style={{ gap: 1 }}>
                <strong>Company</strong>
                <span className="muted" style={{ fontSize: 12.5 }}>{companyName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Permission matrix</h3>
          <span className="hint"><Lock size={13} /> Real company roles × permission keys</span>
        </div>
        <div className="table-wrap">
          {roles.length === 0 || permissions.length === 0 ? (
            <div className="empty">No roles or permissions available for this company yet.</div>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Capability</th>
                  {roles.map((r) => (
                    <th key={r.id} style={{ textAlign: 'center' }}>{r.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.key}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{permissionLabel(p)}</div>
                      {p.description ? (
                        <div className="subtle" style={{ fontWeight: 400, fontSize: 12, marginTop: 2 }}>
                          {p.description}
                        </div>
                      ) : (
                        <div className="subtle" style={{ fontWeight: 400, fontSize: 12, marginTop: 2 }}>
                          {p.key}
                        </div>
                      )}
                    </td>
                    {roles.map((r) => {
                      const has = (r.permissions ?? []).includes(p.key);
                      return (
                        <td key={r.id} style={{ textAlign: 'center' }}>
                          {has ? (
                            <Check size={16} color="var(--green)" />
                          ) : (
                            <span className="subtle">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
