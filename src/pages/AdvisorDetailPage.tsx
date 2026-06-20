import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ArrowLeft, Mail, Phone, MapPin, Building2, Target } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, StatCard, SkeletonRows } from '../components/ui';
import { formatZAR, formatPercent, formatDate } from '../lib/format';
import {
  computeTargets,
  totalPoints,
  PIPELINE_ORDER,
  PHASE_LABELS,
  PHASE_POINTS,
} from '../domain/calculations';
import { Award, Wallet, Layers } from 'lucide-react';

export default function AdvisorDetailPage() {
  const { id } = useParams();
  const advisor = useAsync(() => db.getAdvisor(id!), [id]);
  const cases = useAsync(() => db.getProductionCases());
  const activity = useAsync(() => db.getWeeklyActivity());
  const companies = useAsync(() => db.getCompanies());
  const subs = useAsync(() => db.getSubscriptions());

  const company = useMemo(
    () => companies.data?.find((c) => c.id === advisor.data?.companyId),
    [companies.data, advisor.data],
  );

  if (!advisor.data || !cases.data || !activity.data) {
    return <SkeletonRows rows={6} cols={4} />;
  }

  const a = advisor.data;
  const targets = computeTargets(a.profile);
  const myCases = cases.data.filter((c) => c.advisorId === a.id);
  const issuedCases = myCases.filter((c) => c.status === 'issued');
  const issuedComm = issuedCases.reduce((s, c) => s + (c.issuedCommission ?? 0), 0);
  const attainment = targets.grossMonthlyTarget > 0 ? issuedComm / targets.grossMonthlyTarget : 0;
  const sub = subs.data?.find((s) => s.advisorId === a.id);

  const myWeeks = activity.data
    .filter((w) => w.advisorId === a.id)
    .sort((x, y) => x.weekStart.localeCompare(y.weekStart));
  const latest = myWeeks[myWeeks.length - 1];

  const phaseChart = PIPELINE_ORDER.map((phase) => ({
    phase: PHASE_LABELS[phase],
    actual: latest ? latest.counts[phase] : 0,
    target: targets.weeklyDeliverables[phase],
  }));

  return (
    <>
      <Link to="/advisors" className="back-link">
        <ArrowLeft size={15} /> Back to advisors
      </Link>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="row" style={{ gap: 16 }}>
            <Avatar name={a.name} color={a.avatarColor} size={56} />
            <div className="stack" style={{ gap: 6 }}>
              <div className="row" style={{ gap: 10 }}>
                <h2 style={{ fontSize: 20 }}>{a.name}</h2>
                {a.active ? <Pill tone="green">Active</Pill> : <Pill tone="grey">Inactive</Pill>}
                {sub && (
                  <Pill tone={sub.status === 'active' ? 'blue' : sub.status === 'trial' ? 'amber' : 'red'}>
                    {sub.plan} · {sub.status}
                  </Pill>
                )}
              </div>
              <div className="wrap-gap muted" style={{ fontSize: 13 }}>
                <span className="row" style={{ gap: 5 }}><Mail size={14} /> {a.email}</span>
                <span className="row" style={{ gap: 5 }}><Phone size={14} /> {a.phone}</span>
                <span className="row" style={{ gap: 5 }}><MapPin size={14} /> {a.city}</span>
                {company && <span className="row" style={{ gap: 5 }}><Building2 size={14} /> {company.name}</span>}
              </div>
              <div className="subtle" style={{ fontSize: 12 }}>Joined {formatDate(a.joinedAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-4">
        <StatCard
          label="Gross monthly target"
          value={formatZAR(targets.grossMonthlyTarget)}
          icon={<Target size={18} />}
          iconBg="var(--brand-soft)"
          iconColor="var(--brand)"
        />
        <StatCard
          label="Issued commission"
          value={formatZAR(issuedComm)}
          icon={<Wallet size={18} />}
          iconBg="var(--green-soft)"
          iconColor="var(--green)"
          delta={{ dir: attainment >= 1 ? 'up' : 'down', text: `${formatPercent(attainment)} of target` }}
        />
        <StatCard
          label="This week's points"
          value={latest ? totalPoints(latest.counts) : 0}
          icon={<Award size={18} />}
          iconBg="var(--purple-soft)"
          iconColor="var(--purple)"
        />
        <StatCard
          label="Cases issued"
          value={issuedCases.length}
          icon={<Layers size={18} />}
          iconBg="var(--amber-soft)"
          iconColor="var(--amber)"
          delta={{ dir: 'up', text: `${myCases.length - issuedCases.length} in pipeline` }}
        />
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>This week — actual vs target activity</h3>
            <span className="hint">Weekly deliverables</span>
          </div>
          <div style={{ padding: '12px 12px 4px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={phaseChart} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
                <XAxis dataKey="phase" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
                <Bar dataKey="target" name="Target" fill="#d8dee4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#1f6feb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Target breakdown</h3>
            <span className="hint">Nett → Gross cascade</span>
          </div>
          <div style={{ padding: 16 }}>
            <BreakdownRow label="Nett monthly target" value={formatZAR(targets.nettMonthlyTarget)} />
            <BreakdownRow label="+ Income tax" value={formatZAR(targets.taxAmount)} />
            <BreakdownRow label="= Earnings before tax" value={formatZAR(targets.earningsBeforeTax)} />
            <BreakdownRow label="+ Deductions" value={formatZAR(a.profile.monthlyDeductions)} />
            <BreakdownRow label={`÷ Commission split (${formatPercent(a.profile.commissionSplit)})`} value={formatZAR(targets.earningsBeforeCommSplit)} />
            <BreakdownRow label="× 1.25 buffer = Gross target" value={formatZAR(targets.grossMonthlyTarget)} strong />
            <div style={{ height: 12 }} />
            <BreakdownRow label="Cases needed / month" value={targets.casesIssuedPerMonth.toFixed(1)} />
            <div className="section-title" style={{ marginTop: 16 }}>Weekly deliverables</div>
            {PIPELINE_ORDER.map((phase) => (
              <div key={phase} className="row between" style={{ padding: '5px 0' }}>
                <span className="row" style={{ gap: 8 }}>
                  <span className="pill grey" style={{ minWidth: 22, justifyContent: 'center' }}>{PHASE_POINTS[phase]}</span>
                  {PHASE_LABELS[phase]}
                </span>
                <strong>{targets.weeklyDeliverables[phase]}/wk</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Production cases</h3>
          <span className="hint">{myCases.length} total</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Client</th>
                <th>Product</th>
                <th>Submitted</th>
                <th>Issued</th>
                <th className="num">Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myCases.map((c) => (
                <tr key={c.id}>
                  <td className="nm" style={{ fontWeight: 600 }}>{c.clientName}</td>
                  <td>{c.product}</td>
                  <td className="muted">{formatDate(c.submittedAt)}</td>
                  <td className="muted">{c.issuedAt ? formatDate(c.issuedAt) : '—'}</td>
                  <td className="num">{formatZAR(c.issuedCommission ?? c.potentialCommission)}</td>
                  <td>
                    <Pill tone={c.status === 'issued' ? 'green' : c.status === 'submitted' ? 'amber' : 'grey'}>
                      {c.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function BreakdownRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="row between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-muted)' }}>
      <span className={strong ? '' : 'muted'} style={strong ? { fontWeight: 600 } : undefined}>{label}</span>
      <span style={{ fontWeight: strong ? 700 : 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
