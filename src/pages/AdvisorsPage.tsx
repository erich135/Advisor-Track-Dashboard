import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Avatar, Pill, Progress, SkeletonRows, PageIntro } from '../components/ui';
import { formatZAR, formatPercent, formatDate } from '../lib/format';
import { advisorPerformance } from '../lib/analytics';

export default function AdvisorsPage() {
  const advisors = useAsync(() => db.getAdvisors());
  const cases = useAsync(() => db.getProductionCases());
  const activity = useAsync(() => db.getWeeklyActivity());
  const companies = useAsync(() => db.getCompanies());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const companyName = useMemo(() => {
    const m = new Map<string, string>();
    companies.data?.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [companies.data]);

  if (!advisors.data || !cases.data || !activity.data) {
    return <SkeletonRows rows={8} cols={5} />;
  }

  const perf = advisorPerformance(advisors.data, cases.data, activity.data);
  const perfById = new Map(perf.map((p) => [p.advisor.id, p]));

  const rows = advisors.data
    .filter((a) => (filter === 'all' ? true : filter === 'active' ? a.active : !a.active))
    .filter(
      (a) =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase()) ||
        a.email.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <>
      <PageIntro>
        Every advisor on the platform. Click through for their pipeline, targets and production.
      </PageIntro>

      <div className="row between" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 10 }}>
          <div className="search">
            <Search size={16} className="muted" />
            <input
              placeholder="Search advisors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">All ({advisors.data.length})</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button className="btn primary">
          <UserPlus size={16} /> Invite advisor
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Advisor</th>
                <th>Company</th>
                <th>Joined</th>
                <th className="num">Week points</th>
                <th className="num">Issued comm.</th>
                <th style={{ width: 150 }}>Attainment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const p = perfById.get(a.id);
                return (
                  <tr key={a.id} className="row-link">
                    <td>
                      <Link to={`/advisors/${a.id}`} className="cell-user">
                        <Avatar name={a.name} color={a.avatarColor} />
                        <div>
                          <div className="nm">{a.name}</div>
                          <div className="sm">{a.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td>{a.companyId ? companyName.get(a.companyId) ?? '—' : <span className="subtle">Individual</span>}</td>
                    <td className="muted">{formatDate(a.joinedAt)}</td>
                    <td className="num">{p?.weekPoints ?? '—'}</td>
                    <td className="num">{p ? formatZAR(p.issuedCommission) : '—'}</td>
                    <td>
                      {p ? (
                        <div className="row" style={{ gap: 8 }}>
                          <Progress value={p.attainment * 100} color={p.attainment >= 1 ? 'var(--green)' : undefined} />
                          <span className="subtle" style={{ minWidth: 36, textAlign: 'right' }}>
                            {formatPercent(p.attainment)}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {a.active ? <Pill tone="green">Active</Pill> : <Pill tone="grey">Inactive</Pill>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">No advisors match your search.</div>
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
