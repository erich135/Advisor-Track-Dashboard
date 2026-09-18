import { customerInvoiceVatLabel } from './advisortrackVat';

export const BILLING_MODELS = ['monthly', 'annual', 'custom'] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

export const BILLING_FREQUENCIES = ['monthly', 'quarterly', 'annual', 'custom'] as const;
export type BillingFrequency = (typeof BILLING_FREQUENCIES)[number];

export const PRICING_BASES = ['per_seat', 'fixed_amount', 'custom'] as const;
export type PricingBasis = (typeof PRICING_BASES)[number];

export const PAYMENT_TERMS_CODES = ['due_on_receipt', 'days_7', 'days_15', 'days_30', 'custom'] as const;
export type PaymentTermsCode = (typeof PAYMENT_TERMS_CODES)[number];

export const ADDITIONAL_SEAT_POLICIES = [
  'immediate_proration',
  'next_invoice',
  'quarterly_true_up',
  'annual_true_up',
  'manual_review',
] as const;
export type AdditionalSeatPolicy = (typeof ADDITIONAL_SEAT_POLICIES)[number];

export const SEAT_REDUCTION_POLICIES = [
  'immediate',
  'next_billing_cycle',
  'renewal_only',
  'manual_review',
] as const;
export type SeatReductionPolicy = (typeof SEAT_REDUCTION_POLICIES)[number];

export const CONTRACT_COMMERCIAL_STATUSES = [
  'lead',
  'onboarding',
  'active',
  'suspended',
  'cancelled',
  'expired',
] as const;
export type ContractCommercialStatus = (typeof CONTRACT_COMMERCIAL_STATUSES)[number];

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  custom: 'Custom',
};

export const PRICING_BASIS_LABELS: Record<PricingBasis, string> = {
  per_seat: 'Per Seat',
  fixed_amount: 'Fixed Amount',
  custom: 'Custom',
};

export const PAYMENT_TERMS_LABELS: Record<PaymentTermsCode, string> = {
  due_on_receipt: 'Due on receipt',
  days_7: '7 days',
  days_15: '15 days',
  days_30: '30 days',
  custom: 'Custom',
};

export const ADDITIONAL_SEAT_POLICY_LABELS: Record<AdditionalSeatPolicy, string> = {
  immediate_proration: 'Immediate proration',
  next_invoice: 'Next invoice',
  quarterly_true_up: 'Quarterly true-up',
  annual_true_up: 'Annual true-up',
  manual_review: 'Manual review',
};

export const SEAT_REDUCTION_POLICY_LABELS: Record<SeatReductionPolicy, string> = {
  immediate: 'Immediate',
  next_billing_cycle: 'Next billing cycle',
  renewal_only: 'Renewal only',
  manual_review: 'Manual review',
};

export type CustomerSubscriptionSummary = {
  company: { id: string; name: string };
  planName: string;
  commercialStatus: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  autoRenew: boolean;
  billingModel: string;
  billingFrequency: string;
  billingFrequencyLabel: string;
  pricingBasis: string;
  currency: string;
  committedLicences: number | null;
  currentPurchasedLicences: number | null;
  unitPriceCents: number | null;
  fixedAmountCents: number | null;
  amountDueCents: number | null;
  amountDueLabel: string;
  paymentTermsCode: string;
  paymentTermsLabel: string;
  poReference: string | null;
  billingContactName: string | null;
  billingEmail: string | null;
  billingNotes: string | null;
  vatCharged: boolean;
  vatLabel: string;
  readOnly: true;
};

export type EnterpriseContract = {
  id: string;
  companyId: string | null;
  commercialStatus: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  autoRenew: boolean;
  committedLicences: number | null;
  currentPurchasedLicences?: number | null;
  billingModel: string;
  billingFrequency: string;
  pricingBasis: string;
  negotiatedUnitPriceCents: number | null;
  negotiatedFixedAmountCents: number | null;
  currency: string;
  vatApplicable: boolean;
  vatCharged?: boolean;
  paymentTermsCode: string;
  paymentTermsCustom: string | null;
  poReference: string | null;
  billingContactName: string | null;
  billingEmail: string | null;
  billingNotes: string | null;
  internalNotes: string | null;
  additionalSeatPolicy: string;
  seatReductionPolicy: string;
  additionalSeatsAutoActivate?: boolean;
};

export const ENTERPRISE_PLAN_NAME = 'AdvisorTrack Enterprise';

export function formatLicenceCount(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('en-ZA');
}

export function contractVatCaption(): string {
  return customerInvoiceVatLabel();
}
