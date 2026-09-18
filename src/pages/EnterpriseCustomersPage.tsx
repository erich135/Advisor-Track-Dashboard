import { Link, useNavigate } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';
import { ApiError } from '../api/apiClient';
import { listEnterpriseOnboardings, createEnterpriseOnboarding } from '../api/platformApi';
import { PageIntro, Pill, SkeletonRows, Button } from '../components/ui';
import { isPermissionDeniedError, PermissionDenied } from '../components/PermissionDenied';
import { useAsync } from '../lib/useAsync';
import { COMMERCIAL_STATUS_LABELS, type CommercialStatus } from '../lib/enterpriseOnboarding';
import { useState } from 'react';

function statusTone(status: string): 'green' | 'amber' | 'grey' | 'purple' {
  if (status === 'active') return 'green';
  if (status === 'onboarding' || status === 'lead') return 'amber';
  if (status === 'suspended') return 'purple';
  return 'grey';
}

export default function EnterpriseCustomersPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const loaded = useAsync(() => listEnterpriseOnboardings(), []);

  if (isPermissionDeniedError(loaded.error)) {
    return <PermissionDenied />;
  }

  if (loaded.loading && !loaded.data) {
    return <SkeletonRows rows={6} cols={4} />;
  }

  const rows = loaded.data ?? [];

  async function startOnboarding() {
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createEnterpriseOnboarding({ companyName: 'Untitled enterprise customer' });
      navigate(`/enterprise-customers/${created.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.code === 'ONBOARDING_SCHEMA_MISSING'
            ? 'Local onboarding tables are not applied. On the Abel Backend run npm run enterprise:migrate against advisortrack_local only.'
            : error.message
          : 'Unable to start onboarding.';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PageIntro>
        Internal AdvisorTrack workflow for Erich, Abel and Johan. Create an enterprise customer, capture
        negotiated terms, set the purchased licence pool, and prepare a draft invoice. This page is not part of
        the customer portal.
      </PageIntro>

      <div className="row between" style={{ marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8 }}>
          <Pill tone="purple">Platform / Internal</Pill>
          <Pill tone="grey">Not customer-facing</Pill>
        </div>
        <Button variant="primary" onClick={() => void startOnboarding()} disabled={creating}>
          {creating ? 'Starting…' : 'Create enterprise customer'}
        </Button>
      </div>

      {createError ? (
        <div className="card card-pad" style={{ marginBottom: 16, color: 'var(--red)' }}>
          {createError}
        </div>
      ) : null}

      {loaded.error && !loaded.data ? (
        <div className="card">
          <div className="empty" style={{ color: 'var(--red)' }}>
            {loaded.error instanceof ApiError
              ? loaded.error.code === 'ONBOARDING_SCHEMA_MISSING'
                ? 'Local onboarding tables are not applied. Run npm run enterprise:migrate on Abel Backend against advisortrack_local only.'
                : loaded.error.message
              : 'Unable to load enterprise onboarding drafts.'}
          </div>
        </div>
      ) : (
        <div className="card">
          {rows.length === 0 ? (
            <div className="empty">No enterprise onboarding drafts yet.</div>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Commercial status</th>
                  <th>Licences</th>
                  <th>Org admin</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/enterprise-customers/${row.id}`} style={{ fontWeight: 600 }}>
                        <span className="row" style={{ gap: 8 }}>
                          <Building2 size={16} />
                          {row.companyName}
                        </span>
                      </Link>
                    </td>
                    <td>
                      <Pill tone={statusTone(row.commercialStatus)}>
                        {COMMERCIAL_STATUS_LABELS[row.commercialStatus as CommercialStatus] ??
                          row.commercialStatus}
                      </Pill>
                    </td>
                    <td>{row.purchasedLicences ?? '—'}</td>
                    <td>{row.orgAdmin.email ?? 'Not nominated'}</td>
                    <td>
                      {row.draftInvoiceId ? (
                        <Pill tone="green">Draft created</Pill>
                      ) : (
                        <span className="subtle">Preview only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="subtle" style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Shield size={14} />
        Access is `users.is_platform_admin` only. Customer hierarchy roles cannot open this workflow.
      </div>
    </>
  );
}
