import type { Invoice } from '../domain/types';
import { invoiceTotals } from '../lib/invoice';
import { formatZAR, formatDate, formatPercent } from '../lib/format';

/** Print-ready A4 invoice document. Hidden on screen, shown only when printing
 * (see print styles). The user prints to PDF via the browser dialog. */
export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const totals = invoiceTotals(invoice);
  return (
    <div className="invoice-doc" id="invoice-print">
      <div className="inv-head">
        <div className="inv-brand">
          <span className="inv-logo"><img src="/brand/icon-blue.svg" alt="" /></span>
          <div>
            <div className="inv-co">AdvisorTrack (Pty) Ltd</div>
            <div className="inv-co-sub">Reg 2026/123456/07 · VAT 4123456789</div>
            <div className="inv-co-sub">hello@advisortrack.co.za</div>
          </div>
        </div>
        <div className="inv-title">
          <h1>TAX INVOICE</h1>
          <div className="inv-num">{invoice.number}</div>
          <span className={`pill ${invoice.status === 'paid' ? 'green' : invoice.status === 'overdue' ? 'red' : invoice.status === 'sent' ? 'blue' : 'grey'}`}>
            {invoice.status}
          </span>
        </div>
      </div>

      <div className="inv-parties">
        <div>
          <div className="inv-label">Bill to</div>
          <div className="inv-strong">{invoice.customerName}</div>
          <div className="inv-muted">{invoice.customerEmail}</div>
          <div className="inv-muted" style={{ whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>
        </div>
        <div className="inv-dates">
          <div className="inv-date-row"><span className="inv-label">Issue date</span><span>{formatDate(invoice.issueDate)}</span></div>
          <div className="inv-date-row"><span className="inv-label">Due date</span><span>{formatDate(invoice.dueDate)}</span></div>
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="num">Qty</th>
            <th className="num">Unit price</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((li, i) => (
            <tr key={i}>
              <td>{li.description}</td>
              <td className="num">{li.quantity}</td>
              <td className="num">{formatZAR(li.unitPrice, true)}</td>
              <td className="num">{formatZAR(li.quantity * li.unitPrice, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-totals">
        <div className="inv-total-row"><span>Subtotal</span><span>{formatZAR(totals.subtotal, true)}</span></div>
        <div className="inv-total-row"><span>VAT ({formatPercent(invoice.vatRate)})</span><span>{formatZAR(totals.vat, true)}</span></div>
        <div className="inv-total-row grand"><span>Total due</span><span>{formatZAR(totals.total, true)}</span></div>
      </div>

      {invoice.notes && (
        <div className="inv-notes">
          <div className="inv-label">Notes</div>
          <p>{invoice.notes}</p>
        </div>
      )}

      <div className="inv-foot">
        Thank you for partnering with AdvisorTrack. Payment due by {formatDate(invoice.dueDate)}.
      </div>
    </div>
  );
}
