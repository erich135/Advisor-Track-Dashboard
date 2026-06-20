import { Building2, Users, Briefcase } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Pill, Progress, StatCard, SkeletonRows, PageIntro } from '../components/ui';
import { formatZAR } from '../lib/format';

export default function CompaniesPage() {
  const companies = useAsync(() => db.getCompanies());
  const advisors = useAsync(() => db.getAdvisors());

  if (!companies.data || !advisors.data) return <SkeletonRows rows={5} cols={4} />;

  const totalSeats = companies.data.reduce((s, c) => s + c.licenseSeats, 0);
  const usedSeats = companies.data.reduce((s, c) => s + c.seatsUsed, 0);
  const poolValue = companies.data.reduce((s, c) => s + c.seatsUsed * 2999, 0);

  return (
    <>
      <PageIntro>
        Corporate clients buying license pools. Each pool can later get its own admin and team
        managers — the permission tiers are already modelled.
      </PageIntro>

      <div className="grid grid-3">
        <StatCard label="Companies" value={companies.data.length} icon={<Building2 size={18} />} iconBg="var(--brand-soft)" iconColor="var(--brand)" />
        <StatCard label="Seats used / total" value={`${usedSeats} / ${totalSeats}`} icon={<Users size={18} />} iconBg="var(--purple-soft)" iconColor="var(--purple)" />
        <StatCard label="Annualised pool value" value={formatZAR(poolValue)} icon={<Briefcase size={18} />} iconBg="var(--green-soft)" iconColor="var(--green)" />
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        {companies.data.map((c) => {
          const utilisation = (c.seatsUsed / c.licenseSeats) * 100;
          return (
            <div className="card card-pad" key={c.id}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className="avatar" style={{ width: 38, height: 38, background: 'var(--brand)', borderRadius: 9 }}>
                    <Building2 size={18} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 650 }}>{c.name}</div>
                    <div className="sm muted">{c.city}</div>
                  </div>
                </div>
                <Pill tone={utilisation > 90 ? 'amber' : 'green'}>{Math.round(utilisation)}% used</Pill>
              </div>

              <div className="stack" style={{ gap: 6, marginBottom: 12 }}>
                <div className="row between subtle" style={{ fontSize: 12 }}>
                  <span>Seats</span>
                  <span>{c.seatsUsed} / {c.licenseSeats}</span>
                </div>
                <Progress value={utilisation} color={utilisation > 90 ? 'var(--amber)' : undefined} />
              </div>

              <div className="row between" style={{ borderTop: '1px solid var(--border-muted)', paddingTop: 10, fontSize: 13 }}>
                <div className="stack" style={{ gap: 1 }}>
                  <span className="subtle" style={{ fontSize: 12 }}>Billing contact</span>
                  <span style={{ fontWeight: 600 }}>{c.contactName}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{c.contactEmail}</span>
                </div>
                <div className="stack" style={{ gap: 1, textAlign: 'right' }}>
                  <span className="subtle" style={{ fontSize: 12 }}>Annual value</span>
                  <span style={{ fontWeight: 700 }}>{formatZAR(c.seatsUsed * 2999)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
