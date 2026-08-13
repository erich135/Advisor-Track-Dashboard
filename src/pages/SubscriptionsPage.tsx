import { useMemo, useState } from 'react';
import { CreditCard, Users, Clock, AlertTriangle, Ban } from 'lucide-react';
import { ApiError } from '../api/apiClient';
import { getCompanyMembers, type CompanyMember } from '../api/companyApi';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../lib/useAuth';
import { Avatar, Pill, StatCard, SkeletonRows, PageIntro } from '../components/ui';

const AVATAR_COLORS = ['#1f6feb', '#8957e5', '#2da44e', '#bf8700', '#cf222e', '#0969da', '#1a7f37'];

type AbelSubStatus = 'active' | 'trialing' | 'grace' | 'expired' | 'cancelled';
type FilterTab = 'all' | AbelSubStatus;

const STATUS_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'trialing', label: 'Trialing' },
  { key: 'grace', label: 'Grace' },
  { key: 'expired', label: 'Expired' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusTone: Record<string, string> = {
  active: 'green',
  trialing: 'amber',
  grace: 'amber',
  expired: 'red',
  cancelled: 'grey',
};

function memberName(m: CompanyMember): string {
  return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email;
}

function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function normalizeStatus(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  return raw.trim().toLowerCase();
}

function hasPlan(m: CompanyMember): boolean {
  return Boolean(m.subscription);
}

function statusOf(m: CompanyMember): string | null {
  return normalizeStatus(m.subscription?.status);
}

export default function SubscriptionsPage() {
  const { session } = useAuth();
  const members = useAsync(() => getCompanyMembers());
  const [tab, setTab] = useState<FilterTab>('all');

  const companyName = session?.company?.name || session?.organisation?.name || null;

  const stats = useMemo(() => {
    const list = members.data ?? [];
    let withPlan = 0;
    let active = 0;
    let trialing = 0;
    let grace = 0;
    for (const m of list) {
      if (!hasPlan(m)) continue;
      withPlan += 1;
      const status = statusOf(m);
      if (status === 'active') active += 1;
      else if (status === 'trialing') trialing += 1;
      else if (status === 'grace') grace += 1;
    }
    return { withPlan, active, trialing, grace };
  }, [members.data]);

  const rows = useMemo(() => {
    const list = members.data ?? [];
    if (tab === 'all') return list;
    return list.filter((m) => statusOf(m) === tab);
  }, [members.data, tab]);

  if (members.loading && !members.data) {
    return <SkeletonRows rows={8} cols={5} />;
  }

  if (members.error && !members.data) {
    const message =
      members.error instanceof ApiError
        ? members.error.message
        : 'Unable to load subscriptions. Please try again.';
    return (
      <>
        <PageIntro>
          Subscription plans and statuses for members in your access scope.
        </PageIntro>
        <div className="card">
          <div className="empty" style={{ color: 'var(--red)' }}>{message}</div>
        </div>
      </>
    );
  }

  const all = members.data ?? [];

  return (
    <>
      <PageIntro>
        Subscription plans and statuses for members in your access scope
        {companyName ? ` · ${companyName}` : ''}.
        Plan names come from each member’s Abel subscription snapshot — not invoices or billed amounts.
      </PageIntro>

      <div className="grid grid-4">
        <StatCard
          label="Members with plan"
          value={stats.withPlan}
          icon={<Users size={18} />}
          iconBg="var(--brand-soft)"
          iconColor="var(--brand)"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<CreditCard size={18} />}
          iconBg="var(--green-soft)"
          iconColor="var(--green)"
        />
        <StatCard
          label="Trialing"
          value={stats.trialing}
          icon={<Clock size={18} />}
          iconBg="var(--amber-soft)"
          iconColor="var(--amber)"
        />
        <StatCard
          label="Grace"
          value={stats.grace}
          icon={<AlertTriangle size={18} />}
          iconBg="var(--red-soft)"
          iconColor="var(--red)"
        />
      </div>

      <div className="wrap-gap" style={{ margin: '20px 0 14px' }}>
        {STATUS_TABS.map((t) => {
          const count =
            t.key === 'all'
              ? all.length
              : all.filter((m) => statusOf(m) === t.key).length;
          return (
            <button
              key={t.key}
              type="button"
              className={`btn sm ${tab === t.key ? 'primary' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Status</th>
                {companyName ? <th>Company</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const name = memberName(m);
                const status = statusOf(m);
                const planName = m.subscription?.name?.trim() || m.subscription?.slug || null;
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
                      {planName ? (
                        <div>
                          <div>{planName}</div>
                          {m.subscription?.slug ? (
                            <div className="subtle" style={{ fontSize: 12 }}>{m.subscription.slug}</div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="subtle">—</span>
                      )}
                    </td>
                    <td>
                      {status ? (
                        <Pill tone={statusTone[status] ?? 'grey'}>
                          {status === 'cancelled' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Ban size={12} /> {status}
                            </span>
                          ) : (
                            status
                          )}
                        </Pill>
                      ) : (
                        <span className="subtle">—</span>
                      )}
                    </td>
                    {companyName ? <td>{companyName}</td> : null}
                  </tr>
                );
              })}
              {all.length === 0 && (
                <tr>
                  <td colSpan={companyName ? 4 : 3}>
                    <div className="empty">No members to show for your role yet.</div>
                  </td>
                </tr>
              )}
              {all.length > 0 && rows.length === 0 && (
                <tr>
                  <td colSpan={companyName ? 4 : 3}>
                    <div className="empty">No members match this status filter.</div>
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
