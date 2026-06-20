import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, StatCard, SkeletonRows, PageIntro } from '../components/ui';
import { formatZAR, formatDate } from '../lib/format';
import { issuedCommission, potentialCommission } from '../lib/analytics';

export default function ProductionPage() {
  const cases = useAsync(() => db.getProductionCases());
  const advisors = useAsync(() => db.getAdvisors());
  const [status, setStatus] = useState<'all' | 'submitted' | 'issued'>('all');

  const advisorMap = useMemo(() => new Map(advisors.data?.map((a) => [a.id, a]) ?? []), [advisors.data]);

  if (!cases.data || !advisors.data) return <SkeletonRows rows={8} cols={5} />;

  const issued = issuedCommission(cases.data);
  const potential = potentialCommission(cases.data);
  const issuedCount = cases.data.filter((c) => c.status === 'issued').length;
  const pipelineCount = cases.data.filter((c) => c.status === 'submitted').length;

  // Per-advisor issued vs potential for the chart.
  const perAdvisor = advisors.data
    .filter((a) => a.active)
    .map((a) => {
      const mine = cases.data!.filter((c) => c.advisorId === a.id);
      return {
        name: a.name.split(' ')[0],
        issued: mine.filter((c) => c.status === 'issued').reduce((s, c) => s + (c.issuedCommission ?? 0), 0),
        pipeline: mine.filter((c) => c.status === 'submitted').reduce((s, c) => s + c.potentialCommission, 0),
      };
    })
    .sort((a, b) => b.issued - a.issued)
    .slice(0, 8);

  const rows = cases.data
    .filter((c) => (status === 'all' ? true : c.status === status))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <>
      <PageIntro>Submitted vs issued cases and commission across the whole advisor base.</PageIntro>

      <div className="grid grid-4">
        <StatCard label="Issued commission" value={formatZAR(issued)} icon={<Wallet size={18} />} iconBg="var(--green-soft)" iconColor="var(--green)" />
        <StatCard label="Pipeline value" value={formatZAR(potential)} icon={<TrendingUp size={18} />} iconBg="var(--brand-soft)" iconColor="var(--brand)" />
        <StatCard label="Cases issued" value={issuedCount} icon={<CheckCircle2 size={18} />} iconBg="var(--purple-soft)" iconColor="var(--purple)" />
        <StatCard label="In pipeline" value={pipelineCount} icon={<Clock size={18} />} iconBg="var(--amber-soft)" iconColor="var(--amber)" />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Issued vs pipeline commission by advisor</h3>
          <span className="hint">Top 8</span>
        </div>
        <div style={{ padding: '12px 12px 4px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perAdvisor} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="issued" name="Issued" stackId="a" fill="#1a7f37" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pipeline" name="Pipeline" stackId="a" fill="#9bbcf0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="wrap-gap" style={{ margin: '20px 0 14px' }}>
        {(['all', 'issued', 'submitted'] as const).map((s) => (
          <button key={s} className={`btn sm ${status === s ? 'primary' : ''}`} onClick={() => setStatus(s)} style={{ textTransform: 'capitalize' }}>
            {s === 'submitted' ? 'In pipeline' : s}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Advisor</th>
                <th>Client</th>
                <th>Product</th>
                <th>Submitted</th>
                <th>Issued</th>
                <th className="num">Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const a = advisorMap.get(c.advisorId);
                return (
                  <tr key={c.id}>
                    <td>
                      {a ? (
                        <Link to={`/advisors/${a.id}`} className="cell-user">
                          <Avatar name={a.name} color={a.avatarColor} size={26} />
                          <span className="nm">{a.name}</span>
                        </Link>
                      ) : (
                        c.advisorId
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.clientName}</td>
                    <td>{c.product}</td>
                    <td className="muted">{formatDate(c.submittedAt)}</td>
                    <td className="muted">{c.issuedAt ? formatDate(c.issuedAt) : '—'}</td>
                    <td className="num">{formatZAR(c.issuedCommission ?? c.potentialCommission)}</td>
                    <td><Pill tone={c.status === 'issued' ? 'green' : 'amber'}>{c.status}</Pill></td>
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
