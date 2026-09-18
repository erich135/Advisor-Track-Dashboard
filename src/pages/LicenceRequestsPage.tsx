import { useState } from 'react';
import { ApiError } from '../api/apiClient';
import {
  approvePlatformLicenceRequest,
  getPlatformLicenceRequest,
  listPlatformLicenceRequests,
  rejectPlatformLicenceRequest,
  type StaffLicenceIncreaseRequest,
} from '../api/platformApi';
import { Button, Field, Modal, PageIntro, Pill, SkeletonRows, TextArea, useToast } from '../components/ui';
import { isPermissionDeniedError, PermissionDenied } from '../components/PermissionDenied';
import { StickyHorizontalScroll } from '../components/StickyHorizontalScroll';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

function formatCount(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('en-ZA');
}

function statusTone(status: string): 'green' | 'amber' | 'grey' | 'purple' {
  if (status === 'applied' || status === 'approved') return 'green';
  if (status === 'pending') return 'amber';
  if (status === 'rejected') return 'purple';
  return 'grey';
}

export default function LicenceRequestsPage() {
  const toast = useToast();
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const list = useAsync(() => listPlatformLicenceRequests(), [reloadKey]);
  const detail = useAsync(async () => {
    if (!selectedId) return null;
    return getPlatformLicenceRequest(selectedId);
  }, [selectedId, reloadKey]);

  if (isPermissionDeniedError(list.error)) {
    return <PermissionDenied />;
  }

  const rows = list.data?.requests ?? [];
  const selected: StaffLicenceIncreaseRequest | null = detail.data ?? rows.find((row) => row.id === selectedId) ?? null;

  async function decide(action: 'approve' | 'reject') {
    if (!selected) return;
    setBusy(true);
    try {
      if (action === 'approve') {
        await approvePlatformLicenceRequest(selected.id, { notes: notes.trim() || null });
        toast.push('Licences approved and applied.', 'success');
      } else {
        await rejectPlatformLicenceRequest(selected.id, notes.trim() || null);
        toast.push('Request rejected.', 'success');
      }
      setSelectedId(null);
      setNotes('');
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : 'Unable to update this request.', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (list.loading && !list.data) {
    return <SkeletonRows rows={8} cols={8} />;
  }

  return (
    <>
      <PageIntro>
        Internal queue for additional-licence requests. Approving increases companies.seat_limit once and records an
        immutable seat-change. This is not a customer page.
      </PageIntro>
      <div className="row" style={{ marginBottom: 16, gap: 8 }}>
        <Pill tone="purple">Platform / Internal</Pill>
        <Pill tone="grey">Not customer-facing</Pill>
      </div>

      <div className="card">
        <StickyHorizontalScroll>
          <table className="data">
            <thead>
              <tr>
                <th>Company</th>
                <th>Requested</th>
                <th>Current</th>
                <th>Proposed</th>
                <th>Contract policy</th>
                <th>Requested by</th>
                <th>Requested at</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.companyName || '—'}</td>
                  <td>+{formatCount(row.additionalRequested)}</td>
                  <td>{formatCount(row.currentPurchased)}</td>
                  <td>{formatCount(row.proposedTotal)}</td>
                  <td>{row.billingTreatmentLabel || row.billingTreatment || '—'}</td>
                  <td>{row.requestedByName || '—'}</td>
                  <td>{formatDate(row.requestedAt)}</td>
                  <td>
                    <Pill tone={statusTone(row.status)}>{row.statusLabel || row.status}</Pill>
                  </td>
                  <td>
                    <Button type="button" size="sm" onClick={() => setSelectedId(row.id)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">No licence requests.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      </div>

      <Modal
        title={selected?.companyName || 'Licence request'}
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        actions={
          selected && (selected.status === 'pending' || selected.status === 'approved') ? (
            <>
              <Button type="button" onClick={() => setSelectedId(null)}>
                Close
              </Button>
              <Button type="button" disabled={busy} onClick={() => void decide('reject')}>
                Reject
              </Button>
              <Button type="button" variant="primary" disabled={busy} onClick={() => void decide('approve')}>
                Approve
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          )
        }
      >
        {selected ? (
          <>
            <p className="page-intro">
              Current: {formatCount(selected.currentPurchased)} · Requested: +
              {formatCount(selected.additionalRequested)} · Proposed: {formatCount(selected.proposedTotal)}
            </p>
            <p>
              Policy: {selected.billingTreatmentLabel || selected.billingTreatment || 'Manual review'}
            </p>
            {selected.notes ? <p className="subtle">Customer notes: {selected.notes}</p> : null}
            {selected.status === 'pending' || selected.status === 'approved' ? (
              <Field label="Internal notes">
                <TextArea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </Field>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
}
