import { useState } from 'react';
import { FileText, Plus, Printer, X, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { seedDataService as db } from '../data/seedDataService';
import { useAsync } from '../lib/useAsync';
import { Pill, StatCard, SkeletonRows, PageIntro } from '../components/ui';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { formatZAR, formatDate, relativeDays } from '../lib/format';
import { invoiceTotals } from '../lib/invoice';
import type { Invoice, InvoiceStatus } from '../domain/types';
import '../styles/invoice.css';

const statusTone: Record<InvoiceStatus, string> = {
  draft: 'grey',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
};

export default function InvoicesPage() {
  const invoices = useAsync(() => db.getInvoices());
  const [openId, setOpenId] = useState<string | null>(null);

  if (!invoices.data) return <SkeletonRows rows={5} cols={5} />;

  const outstanding = invoices.data
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + invoiceTotals(i).total, 0);
  const paid = invoices.data.filter((i) => i.status === 'paid').reduce((s, i) => s + invoiceTotals(i).total, 0);
  const overdue = invoices.data.filter((i) => i.status === 'overdue').length;

  const open = invoices.data.find((i) => i.id === openId) ?? null;

  return (
    <>
      <PageIntro>Generate and download tax invoices for customers. Open one and print to PDF.</PageIntro>

      <div className="grid grid-4">
        <StatCard label="Outstanding" value={formatZAR(outstanding)} icon={<FileText size={18} />} iconBg="var(--amber-soft)" iconColor="var(--amber)" />
        <StatCard label="Paid (period)" value={formatZAR(paid)} icon={<CheckCircle2 size={18} />} iconBg="var(--green-soft)" iconColor="var(--green)" />
        <StatCard label="Overdue invoices" value={overdue} icon={<AlertTriangle size={18} />} iconBg="var(--red-soft)" iconColor="var(--red)" />
        <StatCard label="Total invoices" value={invoices.data.length} icon={<Send size={18} />} iconBg="var(--brand-soft)" iconColor="var(--brand)" />
      </div>

      <div className="row between" style={{ margin: '20px 0 14px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>All invoices</h3>
        <button className="btn primary">
          <Plus size={16} /> New invoice
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Issued</th>
                <th>Due</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.data.map((inv) => {
                const totals = invoiceTotals(inv);
                return (
                  <tr key={inv.id} className="row-link" onClick={() => setOpenId(inv.id)}>
                    <td style={{ fontWeight: 600 }}>{inv.number}</td>
                    <td>{inv.customerName}</td>
                    <td className="muted">{formatDate(inv.issueDate)}</td>
                    <td className="muted">
                      {formatDate(inv.dueDate)}
                      {inv.status === 'overdue' && <span className="subtle"> · {relativeDays(inv.dueDate)}</span>}
                    </td>
                    <td className="num">{formatZAR(totals.total)}</td>
                    <td><Pill tone={statusTone[inv.status]}>{inv.status}</Pill></td>
                    <td className="num">
                      <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); setOpenId(inv.id); }}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {open && <InvoiceDrawer invoice={open} onClose={() => setOpenId(null)} />}
    </>
  );
}

function InvoiceDrawer({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-bar">
          <button className="btn ghost sm" onClick={onClose}><X size={16} /></button>
          <strong>{invoice.number}</strong>
          <div className="spacer" style={{ flex: 1 }} />
          <button className="btn primary sm" onClick={() => window.print()}>
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
        <div style={{ padding: 20, background: 'var(--surface-2)' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <InvoiceDocument invoice={invoice} />
          </div>
        </div>
      </div>
    </div>
  );
}
