import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  CreditCard,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  LifeBuoy,
} from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, Progress, StatCard, SkeletonRows } from '../components/ui';
import { formatZAR, formatNumber, formatPercent } from '../lib/format';
import {
  mrr,
  arr,
  activeSubscribers,
  trialCount,
  issuedCommission,
  potentialCommission,
  advisorPerformance,
  weeklyTrend,
  revenueByPlan,
} from '../lib/analytics';

const PIE_COLORS = ['#1f6feb', '#8250df'];

export default function DashboardPage() {
  const advisors = useAsync(() => db.getAdvisors());
  const subs = useAsync(() => db.getSubscriptions());
  const cases = useAsync(() => db.getProductionCases());
  const activity = useAsync(() => db.getWeeklyActivity());
  const tickets = useAsync(() => db.getSupportTickets());

  if (!advisors.data || !subs.data || !cases.data || !activity.data || !tickets.data) {
    return <SkeletonRows rows={6} cols={4} />;
  }

  const monthlyRecurring = mrr(subs.data);
  const annualRecurring = arr(subs.data);
  const active = activeSubscribers(subs.data);
  const trials = trialCount(subs.data);
  const issued = issuedCommission(cases.data);
  const potential = potentialCommission(cases.data);
  const perf = advisorPerformance(advisors.data, cases.data, activity.data);
  const trend = weeklyTrend(activity.data);
  const planSplit = revenueByPlan(subs.data);
  const openTickets = tickets.data.filter((t) => t.status !== 'resolved');

  const topPerformers = perf.slice(0, 5);

  return (
    <>
      <div className="grid grid-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatZAR(monthlyRecurring)}
          icon={<Wallet size={18} />}
          iconBg="var(--green-soft)"
          iconColor="var(--green)"
          delta={{ dir: 'up', text: '8.2% vs last month' }}
        />
        <StatCard
          label="Annual Run Rate"
          value={formatZAR(annualRecurring)}
          icon={<TrendingUp size={18} />}
          iconBg="var(--brand-soft)"
          iconColor="var(--brand)"
          delta={{ dir: 'up', text: 'projected' }}
        />
        <StatCard
          label="Active Subscribers"
          value={formatNumber(active)}
          icon={<CreditCard size={18} />}
          iconBg="var(--purple-soft)"
          iconColor="var(--purple)"
          delta={{ dir: 'up', text: `${trials} on trial` }}
        />
        <StatCard
          label="Issued Commission (advisors)"
          value={formatZAR(issued)}
          icon={<Users size={18} />}
          iconBg="var(--amber-soft)"
          iconColor="var(--amber)"
          delta={{ dir: 'up', text: `${formatZAR(potential)} in pipeline` }}
        />
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-head">
            <h3>Activity & issued cases — last 8 weeks</h3>
            <span className="hint">All advisors combined</span>
          </div>
          <div style={{ padding: '12px 12px 4px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f6feb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1f6feb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
                <Area type="monotone" dataKey="points" name="Activity points" stroke="#1f6feb" strokeWidth={2} fill="url(#gPoints)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Revenue by plan</h3>
            <span className="hint">MRR</span>
          </div>
          <div style={{ padding: 12 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={planSplit} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2}>
                  {planSplit.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="stack" style={{ gap: 8, marginTop: 6 }}>
              {planSplit.map((p, i) => (
                <div key={p.name} className="row between">
                  <span className="row" style={{ gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i] }} />
                    {p.name}
                  </span>
                  <strong>{formatZAR(p.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-head">
            <h3>Top performers</h3>
            <Link to="/advisors" className="btn ghost sm">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Advisor</th>
                  <th className="num">Week points</th>
                  <th className="num">Issued</th>
                  <th className="num">Commission</th>
                  <th style={{ width: 160 }}>Target attainment</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((p) => (
                  <tr key={p.advisor.id}>
                    <td>
                      <Link to={`/advisors/${p.advisor.id}`} className="cell-user">
                        <Avatar name={p.advisor.name} color={p.advisor.avatarColor} />
                        <div>
                          <div className="nm">{p.advisor.name}</div>
                          <div className="sm">{p.advisor.city}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="num">{p.weekPoints}</td>
                    <td className="num">{p.issuedCount}</td>
                    <td className="num">{formatZAR(p.issuedCommission)}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <Progress
                          value={p.attainment * 100}
                          color={p.attainment >= 1 ? 'var(--green)' : undefined}
                        />
                        <span className="subtle" style={{ minWidth: 38, textAlign: 'right' }}>
                          {formatPercent(p.attainment)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Open queries</h3>
            <Link to="/support" className="btn ghost sm">
              <LifeBuoy size={14} /> Inbox
            </Link>
          </div>
          <div className="stack" style={{ padding: 12, gap: 10 }}>
            {openTickets.slice(0, 4).map((t) => (
              <Link
                to="/support"
                key={t.id}
                className="card-pad"
                style={{ border: '1px solid var(--border-muted)', borderRadius: 10, display: 'block' }}
              >
                <div className="row between" style={{ marginBottom: 4 }}>
                  <span className="subtle" style={{ fontSize: 12 }}>{t.reference}</span>
                  <Pill tone={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'amber' : 'grey'}>
                    {t.priority}
                  </Pill>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.subject}</div>
                <div className="sm muted" style={{ fontSize: 12 }}>{t.requesterName}</div>
              </Link>
            ))}
            {openTickets.length === 0 && <div className="empty">No open queries 🎉</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Weekly cold calls vs issued</h3>
          <span className="hint">Pipeline health</span>
        </div>
        <div style={{ padding: '12px 12px 4px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
              <Bar dataKey="coldCalls" name="Cold calls" fill="#8250df" radius={[4, 4, 0, 0]} />
              <Bar dataKey="issued" name="Issued" fill="#1a7f37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
