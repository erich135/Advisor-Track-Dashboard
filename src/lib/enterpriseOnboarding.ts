export const COMMERCIAL_STATUSES = ['lead', 'onboarding', 'active', 'suspended', 'cancelled'] as const;
export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number];

export const BILLING_MODELS = ['monthly', 'annual', 'custom'] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

export const PRICING_TYPES = ['per_seat', 'fixed_monthly', 'fixed_annual', 'custom'] as const;
export type PricingType = (typeof PRICING_TYPES)[number];

export const ONBOARDING_STEPS = [
  'Company details',
  'Commercial terms',
  'Licence quantity',
  'Billing contact',
  'Organisation Administrator',
  'Draft invoice',
  'Review',
] as const;

export const COMMERCIAL_STATUS_LABELS: Record<CommercialStatus, string> = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  active: 'Active',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
};

export type InvoicePreviewLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
};

export function randsToCents(value: string): number {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

export function centsToRandInput(cents: number | null | undefined): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2);
}

export function formatRand(cents: number): string {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildInvoicePreviewLines(input: {
  companyName: string;
  purchasedLicences: number | null;
  billingModel: BillingModel;
  pricingType: PricingType;
  negotiatedAmountCents: number | null;
  extraLines?: InvoicePreviewLine[];
}): InvoicePreviewLine[] {
  const amount = Math.max(0, input.negotiatedAmountCents ?? 0);
  const licences = Math.max(0, input.purchasedLicences ?? 0);
  const period =
    input.billingModel === 'annual' ? 'annual' : input.billingModel === 'custom' ? 'custom term' : 'monthly';
  const primary: InvoicePreviewLine = (() => {
    if (input.pricingType === 'per_seat') {
      return {
        description: `${input.companyName || 'Enterprise'} · ${licences} licence${licences === 1 ? '' : 's'} · ${period}`,
        quantity: Math.max(1, licences || 1),
        unitPriceCents: amount,
        discountCents: 0,
      };
    }
    if (input.pricingType === 'fixed_annual' || input.billingModel === 'annual') {
      return {
        description: `${input.companyName || 'Enterprise'} · fixed annual amount`,
        quantity: 1,
        unitPriceCents: amount,
        discountCents: 0,
      };
    }
    if (input.pricingType === 'fixed_monthly') {
      return {
        description: `${input.companyName || 'Enterprise'} · fixed monthly amount`,
        quantity: 1,
        unitPriceCents: amount,
        discountCents: 0,
      };
    }
    return {
      description: `${input.companyName || 'Enterprise'} · custom negotiated amount`,
      quantity: 1,
      unitPriceCents: amount,
      discountCents: 0,
    };
  })();
  return [primary, ...(input.extraLines ?? [])];
}

export function invoiceLineTotalCents(line: InvoicePreviewLine): number {
  return Math.max(0, line.quantity * line.unitPriceCents - line.discountCents);
}
