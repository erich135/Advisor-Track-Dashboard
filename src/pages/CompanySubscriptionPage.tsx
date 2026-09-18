import { getCompanySubscription } from '../api/companyApi';
import { ApiError } from '../api/apiClient';
import { CompanySubscriptionSummary } from '../components/CompanySubscriptionSummary';
import { isPermissionDeniedError, PermissionDenied } from '../components/PermissionDenied';
import { SkeletonRows } from '../components/ui';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../lib/useAuth';

export default function CompanySubscriptionPage() {
  const { session } = useAuth();
  const loaded = useAsync(() => getCompanySubscription(), [session?.user.id]);

  if (isPermissionDeniedError(loaded.error)) {
    return <PermissionDenied />;
  }

  if (loaded.loading && !loaded.data) {
    return <SkeletonRows rows={8} cols={2} />;
  }

  if (loaded.error && !loaded.data) {
    return (
      <div className="card">
        <div className="empty" style={{ color: 'var(--red)' }}>
          {loaded.error instanceof ApiError ? loaded.error.message : 'Unable to load subscription.'}
        </div>
      </div>
    );
  }

  if (!loaded.data) {
    return (
      <div className="card">
        <div className="empty">No enterprise contract is on file for this company.</div>
      </div>
    );
  }

  return <CompanySubscriptionSummary summary={loaded.data} />;
}
