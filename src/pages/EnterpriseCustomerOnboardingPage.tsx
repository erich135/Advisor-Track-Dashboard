import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/apiClient';
import {
  commitEnterpriseCompany,
  createEnterpriseDraftInvoice,
  getEnterpriseOnboarding,
  patchEnterpriseOnboarding,
  queueEnterpriseOrgAdminInvite,
  type EnterpriseOnboarding,
} from '../api/platformApi';
import { isPermissionDeniedError, PermissionDenied } from '../components/PermissionDenied';
import {
  Button,
  DateInput,
  Field,
  PageIntro,
  Pill,
  SelectInput,
  SkeletonRows,
  TextArea,
  TextInput,
} from '../components/ui';
import {
  ADDITIONAL_SEAT_POLICIES,
  ADDITIONAL_SEAT_POLICY_LABELS,
  BILLING_FREQUENCIES,
  BILLING_FREQUENCY_LABELS,
  PAYMENT_TERMS_CODES,
  PAYMENT_TERMS_LABELS,
  PRICING_BASES,
  PRICING_BASIS_LABELS,
  SEAT_REDUCTION_POLICIES,
  SEAT_REDUCTION_POLICY_LABELS,
  type AdditionalSeatPolicy,
  type BillingFrequency,
  type PaymentTermsCode,
  type PricingBasis,
  type SeatReductionPolicy,
} from '../lib/enterpriseContract';
import { sellerChargesVat } from '../lib/advisortrackVat';
import {
  BILLING_MODELS,
  buildInvoicePreviewLines,
  COMMERCIAL_STATUS_LABELS,
  COMMERCIAL_STATUSES,
  centsToRandInput,
  formatRand,
  invoiceLineTotalCents,
  ONBOARDING_STEPS,
  PRICING_TYPES,
  randsToCents,
  type BillingModel,
  type CommercialStatus,
  type PricingType,
} from '../lib/enterpriseOnboarding';

type ExtraLineDraft = {
  description: string;
  quantity: string;
  unitPriceRands: string;
  discountRands: string;
};

type FormState = {
  companyName: string;
  registrationNumber: string;
  vatRegistered: boolean;
  vatNumber: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactMobile: string;
  billingContactName: string;
  billingEmail: string;
  billingMobile: string;
  orgAdminFirstName: string;
  orgAdminLastName: string;
  orgAdminEmail: string;
  orgAdminMobile: string;
  purchasedLicences: string;
  contractStartDate: string;
  contractEndDate: string;
  billingModel: BillingModel;
  pricingType: PricingType;
  negotiatedAmountRands: string;
  paymentTerms: string;
  poReference: string;
  internalNotes: string;
  billingNotes: string;
  autoRenew: boolean;
  committedLicences: string;
  billingFrequency: BillingFrequency;
  pricingBasis: PricingBasis;
  paymentTermsCode: PaymentTermsCode;
  additionalSeatPolicy: AdditionalSeatPolicy;
  seatReductionPolicy: SeatReductionPolicy;
  additionalSeatsAutoActivate: boolean;
  commercialStatus: CommercialStatus;
  extraLines: ExtraLineDraft[];
};

function fromRecord(row: EnterpriseOnboarding): FormState {
  return {
    companyName: row.companyName ?? '',
    registrationNumber: row.registrationNumber ?? '',
    vatRegistered: row.vatRegistered,
    vatNumber: row.vatNumber ?? '',
    primaryContactName: row.primaryContactName ?? '',
    primaryContactEmail: row.primaryContactEmail ?? '',
    primaryContactMobile: row.primaryContactMobile ?? '',
    billingContactName: row.billingContactName ?? '',
    billingEmail: row.billingEmail ?? '',
    billingMobile: row.billingMobile ?? '',
    orgAdminFirstName: row.orgAdmin.firstName ?? '',
    orgAdminLastName: row.orgAdmin.lastName ?? '',
    orgAdminEmail: row.orgAdmin.email ?? '',
    orgAdminMobile: row.orgAdmin.mobile ?? '',
    purchasedLicences: row.purchasedLicences == null ? '' : String(row.purchasedLicences),
    contractStartDate: row.contractStartDate ?? '',
    contractEndDate: row.contractEndDate ?? '',
    billingModel: (BILLING_MODELS.includes(row.billingModel as BillingModel)
      ? row.billingModel
      : 'monthly') as BillingModel,
    pricingType: (PRICING_TYPES.includes(row.pricingType as PricingType)
      ? row.pricingType
      : 'per_seat') as PricingType,
    negotiatedAmountRands: centsToRandInput(row.negotiatedAmountCents),
    paymentTerms: row.paymentTerms ?? '',
    poReference: row.poReference ?? '',
    internalNotes: row.internalNotes ?? '',
    billingNotes: row.contract?.billingNotes ?? '',
    autoRenew: Boolean(row.contract?.autoRenew),
    committedLicences:
      row.contract?.committedLicences == null ? '' : String(row.contract.committedLicences),
    billingFrequency: (BILLING_FREQUENCIES.includes(row.contract?.billingFrequency as BillingFrequency)
      ? row.contract?.billingFrequency
      : row.billingModel === 'annual'
        ? 'annual'
        : 'monthly') as BillingFrequency,
    pricingBasis: (PRICING_BASES.includes(row.contract?.pricingBasis as PricingBasis)
      ? row.contract?.pricingBasis
      : row.pricingType === 'per_seat'
        ? 'per_seat'
        : row.pricingType === 'custom'
          ? 'custom'
          : 'fixed_amount') as PricingBasis,
    paymentTermsCode: (PAYMENT_TERMS_CODES.includes(row.contract?.paymentTermsCode as PaymentTermsCode)
      ? row.contract?.paymentTermsCode
      : 'days_30') as PaymentTermsCode,
    additionalSeatPolicy: (ADDITIONAL_SEAT_POLICIES.includes(
      row.contract?.additionalSeatPolicy as AdditionalSeatPolicy
    )
      ? row.contract?.additionalSeatPolicy
      : 'next_invoice') as AdditionalSeatPolicy,
    seatReductionPolicy: (SEAT_REDUCTION_POLICIES.includes(
      row.contract?.seatReductionPolicy as SeatReductionPolicy
    )
      ? row.contract?.seatReductionPolicy
      : 'renewal_only') as SeatReductionPolicy,
    additionalSeatsAutoActivate: Boolean(row.contract?.additionalSeatsAutoActivate),
    commercialStatus: (COMMERCIAL_STATUSES.includes(row.commercialStatus as CommercialStatus)
      ? row.commercialStatus
      : 'lead') as CommercialStatus,
    extraLines: (row.extraInvoiceLines ?? []).map((line) => ({
      description: line.description,
      quantity: String(line.quantity),
      unitPriceRands: centsToRandInput(line.unitPriceCents),
      discountRands: centsToRandInput(line.discountCents),
    })),
  };
}

function toPatch(form: FormState): Record<string, unknown> {
  const licences = form.purchasedLicences.trim();
  return {
    companyName: form.companyName.trim() || 'Untitled enterprise customer',
    registrationNumber: form.registrationNumber.trim() || null,
    vatRegistered: form.vatRegistered,
    vatNumber: form.vatNumber.trim() || null,
    primaryContactName: form.primaryContactName.trim() || null,
    primaryContactEmail: form.primaryContactEmail.trim() || null,
    primaryContactMobile: form.primaryContactMobile.trim() || null,
    billingContactName: form.billingContactName.trim() || null,
    billingEmail: form.billingEmail.trim() || null,
    billingMobile: form.billingMobile.trim() || null,
    orgAdminFirstName: form.orgAdminFirstName.trim() || null,
    orgAdminLastName: form.orgAdminLastName.trim() || null,
    orgAdminEmail: form.orgAdminEmail.trim() || null,
    orgAdminMobile: form.orgAdminMobile.trim() || null,
    purchasedLicences: licences === '' ? null : Number(licences),
    contractStartDate: form.contractStartDate || null,
    contractEndDate: form.contractEndDate || null,
    billingModel: form.billingModel,
    pricingType: form.pricingType,
    negotiatedAmountCents: form.negotiatedAmountRands.trim() ? randsToCents(form.negotiatedAmountRands) : null,
    paymentTerms: form.paymentTerms.trim() || null,
    poReference: form.poReference.trim() || null,
    internalNotes: form.internalNotes.trim() || null,
    billingNotes: form.billingNotes.trim() || null,
    autoRenew: form.autoRenew,
    committedLicences: form.committedLicences.trim() === '' ? null : Number(form.committedLicences),
    billingFrequency: form.billingFrequency,
    pricingBasis: form.pricingBasis,
    paymentTermsCode: form.paymentTermsCode,
    additionalSeatPolicy: form.additionalSeatPolicy,
    seatReductionPolicy: form.seatReductionPolicy,
    additionalSeatsAutoActivate: form.additionalSeatsAutoActivate,
    commercialStatus: form.commercialStatus,
    extraInvoiceLines: form.extraLines
      .filter((line) => line.description.trim())
      .map((line) => ({
        description: line.description.trim(),
        quantity: Math.max(1, Number(line.quantity) || 1),
        unitPriceCents: randsToCents(line.unitPriceRands),
        discountCents: randsToCents(line.discountRands),
      })),
  };
}

export default function EnterpriseCustomerOnboardingPage() {
  const { onboardingId = '' } = useParams();
  const [record, setRecord] = useState<EnterpriseOnboarding | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEnterpriseOnboarding(onboardingId)
      .then((row) => {
        if (cancelled) return;
        setRecord(row);
        setForm(fromRecord(row));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isPermissionDeniedError(err)) {
          setDenied(true);
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Unable to load onboarding draft.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onboardingId]);

  const previewLines = useMemo(() => {
    if (!form) return [];
    const extra = (toPatch(form).extraInvoiceLines ?? []) as Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
      discountCents: number;
    }>;
    return buildInvoicePreviewLines({
      companyName: form.companyName,
      purchasedLicences: form.purchasedLicences.trim() ? Number(form.purchasedLicences) : null,
      billingModel: form.billingModel,
      pricingType: form.pricingType,
      negotiatedAmountCents: form.negotiatedAmountRands.trim() ? randsToCents(form.negotiatedAmountRands) : null,
      extraLines: extra,
    });
  }, [form]);

  if (denied) return <PermissionDenied />;
  if (loading || !form || !record) {
    return error ? (
      <div className="card card-pad" style={{ color: 'var(--red)' }}>
        {error}
      </div>
    ) : (
      <SkeletonRows rows={8} cols={2} />
    );
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save(): Promise<EnterpriseOnboarding | null> {
    if (!form) return null;
    setSaving(true);
    setError(null);
    try {
      const updated = await patchEnterpriseOnboarding(onboardingId, toPatch(form));
      setRecord(updated);
      setForm(fromRecord(updated));
      setMessage('Draft saved.');
      return updated;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save draft.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    const saved = await save();
    if (saved) setStep((current) => Math.min(current + 1, ONBOARDING_STEPS.length - 1));
  }

  async function commitCompany() {
    const saved = await save();
    if (!saved) return;
    setSaving(true);
    try {
      const updated = await commitEnterpriseCompany(onboardingId);
      setRecord(updated);
      setForm(fromRecord(updated));
      setMessage(
        updated.companyId
          ? `Company created. Commercial status is ${updated.commercialStatus}. No invoice number allocated yet.`
          : 'Company already existed.'
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create the company.');
    } finally {
      setSaving(false);
    }
  }

  async function saveDraftInvoice() {
    const saved = await save();
    if (!saved) return;
    setSaving(true);
    try {
      const result = await createEnterpriseDraftInvoice(onboardingId);
      setRecord(result.onboarding);
      setForm(fromRecord(result.onboarding));
      setMessage(
        result.allocatedNewNumber
          ? `Draft invoice ${result.invoice.invoiceNumber} created. Number allocated now because invoices allocate INV100000+ on create. Not issued or emailed.`
          : `Draft invoice ${result.invoice.invoiceNumber} is still editable.`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create the draft invoice.');
    } finally {
      setSaving(false);
    }
  }

  async function queueInvite() {
    const saved = await save();
    if (!saved) return;
    setSaving(true);
    try {
      const updated = await queueEnterpriseOrgAdminInvite(onboardingId);
      setRecord(updated);
      setForm(fromRecord(updated));
      setMessage(
        `Organisation Administrator invite queued locally for ${updated.orgAdmin.email}. No email sent. No password issued.`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to queue the invite.');
    } finally {
      setSaving(false);
    }
  }

  const invoiceAllocated = Boolean(record.draftInvoiceId);
  const companyCreated = Boolean(record.companyId);

  return (
    <>
      <PageIntro>
        Internal enterprise onboarding. Organisation Administrator is a company-scoped grant nomination, not a
        reporting-hierarchy role. Invoice numbers are not consumed until you explicitly save a draft invoice.
      </PageIntro>

      <div className="row between" style={{ marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Pill tone="purple">Platform / Internal</Pill>
          <Pill tone="amber">
            Commercial: {COMMERCIAL_STATUS_LABELS[form.commercialStatus]}
          </Pill>
          <Pill tone={invoiceAllocated ? 'green' : 'grey'}>
            Invoice: {invoiceAllocated ? 'Draft (number allocated)' : 'Preview only'}
          </Pill>
        </div>
        <Link to="/enterprise-customers">Back to enterprise customers</Link>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {ONBOARDING_STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`btn ${index === step ? 'primary' : 'ghost'}`}
            onClick={() => setStep(index)}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {message ? (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="card card-pad" style={{ marginBottom: 16, color: 'var(--red)' }}>
          {error}
        </div>
      ) : null}

      <div className="card card-pad">
        {step === 0 ? (
          <div className="form-grid cols-2">
            <Field label="Company name">
              <TextInput value={form.companyName} onChange={(event) => update('companyName', event.target.value)} />
            </Field>
            <Field label="Registration number">
              <TextInput
                value={form.registrationNumber}
                onChange={(event) => update('registrationNumber', event.target.value)}
              />
            </Field>
            <Field label="Customer VAT vendor" hint="Their company identity. AdvisorTrack does not charge VAT.">
              <SelectInput
                value={form.vatRegistered ? 'yes' : 'no'}
                onChange={(event) => update('vatRegistered', event.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </SelectInput>
            </Field>
            <Field label="Customer VAT number" hint={sellerChargesVat() ? undefined : 'Not printed on AdvisorTrack invoices while AdvisorTrack is unregistered.'}>
              <TextInput value={form.vatNumber} onChange={(event) => update('vatNumber', event.target.value)} />
            </Field>
            <Field label="Primary contact name">
              <TextInput
                value={form.primaryContactName}
                onChange={(event) => update('primaryContactName', event.target.value)}
              />
            </Field>
            <Field label="Primary contact email">
              <TextInput
                type="email"
                value={form.primaryContactEmail}
                onChange={(event) => update('primaryContactEmail', event.target.value)}
              />
            </Field>
            <Field label="Primary contact mobile">
              <TextInput
                value={form.primaryContactMobile}
                onChange={(event) => update('primaryContactMobile', event.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="form-grid cols-2">
            <Field label="Commercial status" hint="Separate from invoice/payment status">
              <SelectInput
                value={form.commercialStatus}
                onChange={(event) => update('commercialStatus', event.target.value as CommercialStatus)}
              >
                {COMMERCIAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {COMMERCIAL_STATUS_LABELS[status]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Billing model">
              <SelectInput
                value={form.billingModel}
                onChange={(event) => update('billingModel', event.target.value as BillingModel)}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="custom">Custom</option>
              </SelectInput>
            </Field>
            <Field label="Pricing type" hint="Negotiated. Not public Android/mobile list price.">
              <SelectInput
                value={form.pricingType}
                onChange={(event) => update('pricingType', event.target.value as PricingType)}
              >
                <option value="per_seat">Per-seat negotiated amount</option>
                <option value="fixed_monthly">Fixed monthly amount</option>
                <option value="fixed_annual">Fixed annual amount</option>
                <option value="custom">Manually defined custom amount</option>
              </SelectInput>
            </Field>
            <Field label="Pricing basis">
              <SelectInput
                value={form.pricingBasis}
                onChange={(event) => update('pricingBasis', event.target.value as PricingBasis)}
              >
                {PRICING_BASES.map((basis) => (
                  <option key={basis} value={basis}>
                    {PRICING_BASIS_LABELS[basis]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Billing frequency" hint="Independent of contract duration">
              <SelectInput
                value={form.billingFrequency}
                onChange={(event) => update('billingFrequency', event.target.value as BillingFrequency)}
              >
                {BILLING_FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {BILLING_FREQUENCY_LABELS[frequency]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Negotiated amount (ZAR)">
              <TextInput
                value={form.negotiatedAmountRands}
                onChange={(event) => update('negotiatedAmountRands', event.target.value)}
              />
            </Field>
            <Field label="Contract start date">
              <DateInput
                value={form.contractStartDate}
                onChange={(event) => update('contractStartDate', event.target.value)}
              />
            </Field>
            <Field label="Contract end date">
              <DateInput
                value={form.contractEndDate}
                onChange={(event) => update('contractEndDate', event.target.value)}
              />
            </Field>
            <Field label="Payment terms">
              <SelectInput
                value={form.paymentTermsCode}
                onChange={(event) => update('paymentTermsCode', event.target.value as PaymentTermsCode)}
              >
                {PAYMENT_TERMS_CODES.map((code) => (
                  <option key={code} value={code}>
                    {PAYMENT_TERMS_LABELS[code]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Custom payment terms text">
              <TextInput value={form.paymentTerms} onChange={(event) => update('paymentTerms', event.target.value)} />
            </Field>
            <Field label="PO / customer reference">
              <TextInput value={form.poReference} onChange={(event) => update('poReference', event.target.value)} />
            </Field>
            <Field label="Auto-renew">
              <SelectInput
                value={form.autoRenew ? 'yes' : 'no'}
                onChange={(event) => update('autoRenew', event.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </SelectInput>
            </Field>
            <Field label="Additional seat billing" hint="Billing treatment when extra licences are approved.">
              <SelectInput
                value={form.additionalSeatPolicy}
                onChange={(event) => update('additionalSeatPolicy', event.target.value as AdditionalSeatPolicy)}
              >
                {ADDITIONAL_SEAT_POLICIES.map((policy) => (
                  <option key={policy} value={policy}>
                    {ADDITIONAL_SEAT_POLICY_LABELS[policy]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field
              label="Auto-activate additional licences"
              hint="Off by default. Only enable when this contract explicitly allows immediate activation."
            >
              <SelectInput
                value={form.additionalSeatsAutoActivate ? 'yes' : 'no'}
                onChange={(event) => update('additionalSeatsAutoActivate', event.target.value === 'yes')}
              >
                <option value="no">No — request then internal review</option>
                <option value="yes">Yes — apply when requested</option>
              </SelectInput>
            </Field>
            <Field label="Seat reductions" hint="Stored policy only. Not executed here.">
              <SelectInput
                value={form.seatReductionPolicy}
                onChange={(event) => update('seatReductionPolicy', event.target.value as SeatReductionPolicy)}
              >
                {SEAT_REDUCTION_POLICIES.map((policy) => (
                  <option key={policy} value={policy}>
                    {SEAT_REDUCTION_POLICY_LABELS[policy]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <div style={{ gridColumn: '1 / -1' }} className="subtle">
              AdvisorTrack is not VAT registered. Invoices show the negotiated amount as the amount due. VAT is not
              charged and no AdvisorTrack VAT number is printed.
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Billing notes (customer-visible)">
                <TextArea
                  value={form.billingNotes}
                  onChange={(event) => update('billingNotes', event.target.value)}
                  rows={3}
                />
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Internal commercial notes (hidden from customers)">
                <TextArea
                  value={form.internalNotes}
                  onChange={(event) => update('internalNotes', event.target.value)}
                  rows={4}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="form-grid cols-2">
            <Field
              label="Committed licences"
              hint="Commercial minimum. Later seat increases do not overwrite this without history."
            >
              <TextInput
                type="number"
                min={0}
                value={form.committedLicences}
                onChange={(event) => update('committedLicences', event.target.value)}
              />
            </Field>
            <Field
              label="Current purchased licences"
              hint="Operational seat pool (companies.seat_limit). May exceed committed."
            >
              <TextInput
                type="number"
                min={0}
                value={form.purchasedLicences}
                onChange={(event) => update('purchasedLicences', event.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="form-grid cols-2">
            <Field label="Billing contact name">
              <TextInput
                value={form.billingContactName}
                onChange={(event) => update('billingContactName', event.target.value)}
              />
            </Field>
            <Field label="Billing email">
              <TextInput
                type="email"
                value={form.billingEmail}
                onChange={(event) => update('billingEmail', event.target.value)}
              />
            </Field>
            <Field label="Billing mobile">
              <TextInput
                value={form.billingMobile}
                onChange={(event) => update('billingMobile', event.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="form-grid cols-2">
            <div style={{ gridColumn: '1 / -1' }} className="subtle">
              Nominate the customer’s first Organisation Administrator. Do not force Executive / RM / TL. No
              password is created here, and no customer email is sent.
            </div>
            <Field label="Organisation Administrator first name">
              <TextInput
                value={form.orgAdminFirstName}
                onChange={(event) => update('orgAdminFirstName', event.target.value)}
              />
            </Field>
            <Field label="Organisation Administrator last name">
              <TextInput
                value={form.orgAdminLastName}
                onChange={(event) => update('orgAdminLastName', event.target.value)}
              />
            </Field>
            <Field label="Organisation Administrator email">
              <TextInput
                type="email"
                value={form.orgAdminEmail}
                onChange={(event) => update('orgAdminEmail', event.target.value)}
              />
            </Field>
            <Field label="Organisation Administrator mobile">
              <TextInput
                value={form.orgAdminMobile}
                onChange={(event) => update('orgAdminMobile', event.target.value)}
              />
            </Field>
            <div>
              <Pill tone={record.orgAdmin.inviteStatus === 'queued_local' ? 'green' : 'grey'}>
                Invite: {record.orgAdmin.inviteStatus}
              </Pill>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="stack" style={{ gap: 16 }}>
            <div className="subtle">
              Preview stays editable and does not allocate an invoice number. Saving a draft invoice uses the
              existing INV100000+ sequence.
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Discount</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {previewLines.map((line, index) => (
                  <tr key={`${line.description}-${index}`}>
                    <td>{line.description}</td>
                    <td>{line.quantity}</td>
                    <td>{formatRand(line.unitPriceCents)}</td>
                    <td>{formatRand(line.discountCents)}</td>
                    <td>{formatRand(invoiceLineTotalCents(line))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="form-grid cols-2">
              {form.extraLines.map((line, index) => (
                <div key={index} style={{ gridColumn: '1 / -1' }} className="form-grid cols-2">
                  <Field label="Extra line description">
                    <TextInput
                      value={line.description}
                      onChange={(event) => {
                        const extraLines = [...form.extraLines];
                        extraLines[index] = { ...line, description: event.target.value };
                        update('extraLines', extraLines);
                      }}
                    />
                  </Field>
                  <Field label="Quantity">
                    <TextInput
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(event) => {
                        const extraLines = [...form.extraLines];
                        extraLines[index] = { ...line, quantity: event.target.value };
                        update('extraLines', extraLines);
                      }}
                    />
                  </Field>
                  <Field label="Unit amount (ZAR)">
                    <TextInput
                      value={line.unitPriceRands}
                      onChange={(event) => {
                        const extraLines = [...form.extraLines];
                        extraLines[index] = { ...line, unitPriceRands: event.target.value };
                        update('extraLines', extraLines);
                      }}
                    />
                  </Field>
                  <Field label="Discount (ZAR)">
                    <TextInput
                      value={line.discountRands}
                      onChange={(event) => {
                        const extraLines = [...form.extraLines];
                        extraLines[index] = { ...line, discountRands: event.target.value };
                        update('extraLines', extraLines);
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={() =>
                update('extraLines', [
                  ...form.extraLines,
                  { description: '', quantity: '1', unitPriceRands: '', discountRands: '' },
                ])
              }
            >
              Add extra line item
            </Button>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="stack" style={{ gap: 12 }}>
            <div>
              <strong>{form.companyName}</strong>
              {companyCreated ? (
                <div className="subtle">
                  Company id {record.companyId}.{' '}
                  <Link to={`/companies/${record.companyId}`}>Open customer account</Link>
                </div>
              ) : (
                <div className="subtle">Company row has not been created yet.</div>
              )}
            </div>
            <div>Purchased licences: {form.purchasedLicences || '—'}</div>
            <div>
              Org admin: {form.orgAdminFirstName} {form.orgAdminLastName} · {form.orgAdminEmail || 'not nominated'}
            </div>
            <div>Billing: {form.billingContactName || '—'} · {form.billingEmail || '—'}</div>
            <div>
              Commercial status {COMMERCIAL_STATUS_LABELS[form.commercialStatus]} · invoice{' '}
              {invoiceAllocated ? 'Draft created' : 'preview only'}
            </div>
            <div className="subtle">Ready for invite / activation is queued locally. No production activation.</div>
          </div>
        ) : null}

        <div className="row" style={{ gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <Button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
            Back
          </Button>
          {step < ONBOARDING_STEPS.length - 1 ? (
            <Button type="button" variant="primary" disabled={saving} onClick={() => void goNext()}>
              Save and continue
            </Button>
          ) : (
            <Button type="button" variant="primary" disabled={saving} onClick={() => void save()}>
              Save draft
            </Button>
          )}
          <Button type="button" disabled={saving} onClick={() => void save()}>
            Save
          </Button>
          <Button type="button" disabled={saving || companyCreated} onClick={() => void commitCompany()}>
            Create company
          </Button>
          <Button type="button" disabled={saving || !companyCreated} onClick={() => void saveDraftInvoice()}>
            {invoiceAllocated ? 'Refresh draft invoice' : 'Create draft invoice'}
          </Button>
          <Button type="button" disabled={saving || !form.orgAdminEmail} onClick={() => void queueInvite()}>
            Queue org admin invite locally
          </Button>
        </div>
      </div>
    </>
  );
}
