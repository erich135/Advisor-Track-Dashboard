import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Wallet, Clock, AlertTriangle } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, StatCard, SkeletonRows, PageIntro } from '../components/ui';
import { formatZAR, formatDate, relativeDays } from '../lib/format';
import { mrr, activeSubscribers, trialCount } from '../lib/analytics';
import type { SubscriptionStatus } from '../domain/types';

const statusTone: Record<SubscriptionStatus, string> = {
  active: 'green',
  trial: 'amber',
  past_due: 'red',
  cancelled: 'grey',
};

export default function SubscriptionsPage() {
  const subs = useAsync(() => db.getSubscriptions());
  const advisors = useAsync(() => db.getAdvisors());
  const [tab, setTab] = useState<'all' | SubscriptionStatus>('all');

  const advisorMap = useMemo(() => {
    const m = new Map(advisors.data?.map((a) => [a.id, a]) ?? []);
    return m;
  }, [advisors.data]);

  if (!subs.data || !advisors.data) return <SkeletonRows rows={8} cols={5} />;

  const monthlyRecurring = mrr(subs.data);
  const active = activeSubscribers(subs.data);
  const trials = trialCount(subs.data);
  const pastDue = subs.data.filter((s) => s.status === 'past_due').length;

  const rows = subs.data.filter((s) => (tab === 'all' ? true : s.status === tab));

  const tabs: { key: 'all' | SubscriptionStatus; label: string }[] = [
    { key: 'all', label: `All (${subs.data.length})` },
    { key: 'active', label: 'Active' },
    { key: 'trial', label: 'Trials' },
    { key: 'past_due', label: 'Past due' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <>
      <PageIntro>License subscriptions across individuals and company pools. R299/mo · R2999/yr.</PageIntro>

      <div className="grid grid-4">
        <StatCard label="Monthly recurring revenue" value={formatZAR(monthlyRecurring)} icon={<Wallet size={18} />} iconBg="var(--green-soft)" iconColor="var(--green)" />
        <StatCard label="Active licenses" value={active} icon={<CreditCard size={18} />} iconBg="var(--brand-soft)" iconColor="var(--brand)" />
        <StatCard label="On trial" value={trials} icon={<Clock size={18} />} iconBg="var(--amber-soft)" iconColor="var(--amber)" />
        <StatCard label="Past due" value={pastDue} icon={<AlertTriangle size={18} />} iconBg="var(--red-soft)" iconColor="var(--red)" />
      </div>

      <div className="wrap-gap" style={{ margin: '20px 0 14px' }}>
        {tabs.map((t) => (
          <button key={t.key} className={`btn sm ${tab === t.key ? 'primary' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Advisor</th>
                <th>Plan</th>
                <th className="num">Amount</th>
                <th>Started</th>
                <th>Renews</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const a = advisorMap.get(s.advisorId);
                return (
                  <tr key={s.id}>
                    <td>
                      {a ? (
                        <Link to={`/advisors/${a.id}`} className="cell-user">
                          <Avatar name={a.name} color={a.avatarColor} />
                          <div>
                            <div className="nm">{a.name}</div>
                            <div className="sm">{a.email}</div>
                          </div>
                        </Link>
                      ) : (
                        s.advisorId
                      )}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{s.plan}</td>
                    <td className="num">{formatZAR(s.amount)}{s.plan === 'monthly' ? '/mo' : '/yr'}</td>
                    <td className="muted">{formatDate(s.startedAt)}</td>
                    <td className="muted">
                      {s.status === 'trial' && s.trialEndsAt
                        ? <span className="pill amber">Trial ends {relativeDays(s.trialEndsAt)}</span>
                        : <>{formatDate(s.renewsAt)} <span className="subtle">· {relativeDays(s.renewsAt)}</span></>}
                    </td>
                    <td><Pill tone={statusTone[s.status]}>{s.status.replace('_', ' ')}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
