import { apiDownload, apiRequest } from './apiClient';
import type { CompanyMember, CompanyMemberDetail, LicencePool, MemberOffboardingResult } from './companyApi';

export type PlatformCompany = {
  id: string;
  name: string;
  slug?: string;
  seatLimit?: number | null;
  isPlatform?: boolean;
  isActive?: boolean;
  memberCount?: number;
  createdAt?: string;
};

/** Platform admin: list every company. */
export async function getPlatformCompanies(): Promise<PlatformCompany[]> {
  return apiRequest<PlatformCompany[]>('/platform/companies');
}

export type PlatformCompanyOverview = {
  company: PlatformCompany;
  roles: Array<{ id: string; name: string }>;
  members: CompanyMember[];
};

/** Platform admin: one company plus its roles and members. */
export async function getPlatformCompanyOverview(companyId: string): Promise<PlatformCompanyOverview> {
  return apiRequest<PlatformCompanyOverview>(`/platform/companies/${encodeURIComponent(companyId)}`);
}

export type CommercialPackage = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  billingInterval: string | null;
  billingCycle: string | null;
};

export type CompanySubscription = {
  company: { id: string; name: string; slug: string; isPlatform: boolean };
  subscriptionStatus: 'active' | 'suspended' | 'cancelled' | string;
  accountStatus: 'Active' | 'Inactive' | string;
  plan: { slug: string; name: string | null; priceCents: number | null; currency: string } | null;
  licencePriceCents: number | null;
  currency: string;
  billingCycle: string | null;
  billingInterval: string | null;
  subscriptionStartedAt: string | null;
  nextBillingAt: string | null;
  vatTreatment: { registered: boolean; ratePercent: number | null; label: string };
  billingContact: { userId: string | null; name: string | null; email: string | null } | null;
  licencePool: LicencePool;
  createdAt: string;
};

export type SubscriptionAuditEvent = {
  id: string;
  action: string;
  resourceType: string;
  createdAt: string;
  actor: { email: string; name: string };
  previousQuantity: number | null;
  newQuantity: number | null;
  difference: number | null;
  reason: string | null;
  targetUserId: string | null;
};

export type InvoiceSnapshot = {
  registeredName: string;
  tradingName: string | null;
  registrationNumber: string | null;
  vatRegistered: boolean;
  vatNumber: string | null;
  billingContactName: string | null;
  billingEmail: string | null;
  telephone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  planSlug: string | null;
  planName: string | null;
};

export type InvoiceLine = {
  id?: string;
  sortOrder: number;
  description: string;
  quantity: string;
  unitPriceCents: number;
  discountCents: number;
  vatRatePercent: string;
  lineSubtotalCents: number;
  lineVatCents: number;
  lineTotalCents: number;
};

export type InvoiceSummary = {
  id: string;
  companyId: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  status: string;
  presentationStatus: string;
  paymentDate: string | null;
  issuedAt: string | null;
  createdAt: string;
};

export type InvoiceDetail = InvoiceSummary & {
  poReference: string | null;
  customerReference?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  sourceContractId?: string | null;
  notes: string | null;
  paymentTerms: string | null;
  snapshot: InvoiceSnapshot;
  lines: InvoiceLine[];
  paidAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
  duplicatedFromInvoiceId: string | null;
  updatedAt: string;
  editable?: boolean;
  locked?: boolean;
  vatCharged?: boolean;
  sellerVatRegistered?: boolean;
  statusEvents: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    actor: { email: string; name: string };
  }>;
  deliveryEvents: InvoiceDeliveryEvent[];
  lastDelivery: InvoiceDeliveryEvent | null;
};

export type InvoiceDeliveryEvent = {
  id: string;
  channel: string;
  status: string;
  recipientEmail: string | null;
  errorMessage: string | null;
  providerMessageId: string | null;
  snapshotRef: string | null;
  createdAt: string;
  actor: { email: string; name: string } | null;
};

export type CompanyBillingProfile = {
  companyId: string;
  registeredName: string;
  tradingName: string | null;
  registrationNumber: string | null;
  vatRegistered: boolean;
  vatNumber: string | null;
  vatRatePercent: number | null;
  billingContactName: string | null;
  billingEmail: string | null;
  telephone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  company: { id: string; name: string; slug: string };
  subscription: {
    planSlug: string | null;
    planName: string | null;
    licencePriceCents: number | null;
    vatRegistered: boolean;
    vatRatePercent: number | null;
    purchased: number | null;
  };
};

export type CompanySubscriptionDetail = CompanySubscription & {
  allocationHistory: SubscriptionAuditEvent[];
  invoices: InvoiceSummary[];
  invoicing: { available: boolean; message: string };
  packages: CommercialPackage[];
};

export type PlatformSubscriptionsList = {
  companies: CompanySubscription[];
  packages: CommercialPackage[];
};

export async function listPlatformSubscriptions(): Promise<PlatformSubscriptionsList> {
  return apiRequest<PlatformSubscriptionsList>('/platform/subscriptions');
}

export async function getPlatformSubscription(companyId: string): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}`
  );
}

export async function patchPlatformSubscription(
  companyId: string,
  body: {
    packageSlug?: string;
    billingInterval?: 'month' | 'year';
    vatRegistered?: boolean;
    vatRatePercent?: number | null;
    billingContactName?: string | null;
    billingContactEmail?: string | null;
    reason?: string;
  }
): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}`,
    { method: 'PATCH', body }
  );
}

export async function setPlatformPurchasedLicences(
  companyId: string,
  body: { purchased: number | null; reason?: string }
): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}/licences`,
    { method: 'PATCH', body }
  );
}

export async function addPlatformLicences(
  companyId: string,
  body: { quantity: number; reason?: string }
): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}/licences/add`,
    { method: 'POST', body }
  );
}

export async function reducePlatformLicences(
  companyId: string,
  body: { quantity: number; reason?: string }
): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}/licences/reduce`,
    { method: 'POST', body }
  );
}

export async function activatePlatformSubscription(
  companyId: string,
  reason?: string
): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}/activate`,
    { method: 'POST', body: { reason } }
  );
}

export async function suspendPlatformSubscription(
  companyId: string,
  reason?: string
): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}/suspend`,
    { method: 'POST', body: { reason } }
  );
}

export async function cancelPlatformSubscription(
  companyId: string,
  reason?: string
): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>(
    `/platform/subscriptions/${encodeURIComponent(companyId)}/cancel`,
    { method: 'POST', body: { reason } }
  );
}

export type InvoiceLineWrite = {
  description: string;
  quantity: string | number;
  unitPriceCents?: number;
  unitPrice?: string | number;
  discountCents?: number;
  discount?: string | number;
  vatRatePercent?: string | number;
};

export type InvoiceWriteBody = {
  companyId?: string;
  invoiceDate: string;
  dueDate: string;
  poReference?: string | null;
  notes?: string | null;
  paymentTerms?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  customerReference?: string | null;
  sourceContractId?: string | null;
  attachBillingAdjustmentIds?: string[];
  attachPendingAdjustments?: boolean;
  billing?: {
    registeredName: string;
    tradingName?: string | null;
    registrationNumber?: string | null;
    vatRegistered: boolean;
    vatNumber?: string | null;
    billingContactName?: string | null;
    billingEmail?: string | null;
    telephone?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  lines: InvoiceLineWrite[];
};

export async function listPlatformInvoices(companyId?: string): Promise<{ invoices: InvoiceSummary[] }> {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
  return apiRequest<{ invoices: InvoiceSummary[] }>(`/platform/invoices${query}`);
}

export async function getPlatformInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}`);
}

export async function getPlatformBillingProfile(companyId: string): Promise<CompanyBillingProfile> {
  return apiRequest<CompanyBillingProfile>(`/platform/billing-profiles/${encodeURIComponent(companyId)}`);
}

export async function createPlatformInvoice(body: InvoiceWriteBody & { companyId: string }): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>('/platform/invoices', { method: 'POST', body });
}

export async function updatePlatformDraftInvoice(
  invoiceId: string,
  body: Partial<InvoiceWriteBody>
): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'PATCH',
    body,
  });
}

export async function sendPlatformInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}/send`, {
    method: 'POST',
    body: {},
  });
}

export async function issuePlatformInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}/issue`, {
    method: 'POST',
    body: {},
  });
}

export type InvoiceContractPrefill = {
  companyId: string;
  companyName: string;
  planName: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  poReference: string | null;
  customerReference: string | null;
  paymentTerms: string;
  notes: string | null;
  billingContactName: string | null;
  billingEmail: string | null;
  sourceContractId: string;
  pricingBasis: string;
  billingFrequency: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
  }>;
  editableSnapshot: true;
  pendingAdjustmentIds?: string[];
};

export async function getInvoicePrefill(companyId: string): Promise<InvoiceContractPrefill> {
  return apiRequest<InvoiceContractPrefill>(
    `/platform/companies/${encodeURIComponent(companyId)}/invoice-prefill`
  );
}

export async function markPlatformInvoicePaid(
  invoiceId: string,
  paymentDate: string
): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}/mark-paid`, {
    method: 'POST',
    body: { paymentDate },
  });
}

export async function cancelPlatformInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}/cancel`, {
    method: 'POST',
    body: {},
  });
}

export async function voidPlatformInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}/void`, {
    method: 'POST',
    body: {},
  });
}

export async function duplicatePlatformInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/platform/invoices/${encodeURIComponent(invoiceId)}/duplicate`, {
    method: 'POST',
    body: {},
  });
}

export async function downloadPlatformInvoicePdf(invoiceId: string): Promise<{ blob: Blob; filename: string }> {
  return apiDownload(`/platform/invoices/${encodeURIComponent(invoiceId)}/pdf`);
}

export type PlatformCustomerAccount = {
  company: PlatformCompany;
  members: CompanyMember[];
  roles: Array<{ id: string; name: string }>;
  subscription: CompanySubscriptionDetail;
  invoices: InvoiceSummary[];
  tabs: Array<'overview' | 'users' | 'subscription' | 'licences' | 'invoices'>;
};

export async function getPlatformCustomer(companyId: string): Promise<PlatformCustomerAccount> {
  return apiRequest<PlatformCustomerAccount>(`/platform/customers/${encodeURIComponent(companyId)}`);
}

export async function listPlatformCustomerAssignableRoles(companyId: string) {
  return apiRequest<Array<{ id: string; name: string; rank: string; rankLabel: string }>>(
    `/platform/customers/${encodeURIComponent(companyId)}/assignable-roles`
  );
}

export async function getPlatformCustomerLicencePool(companyId: string): Promise<LicencePool> {
  return apiRequest<LicencePool>(`/platform/customers/${encodeURIComponent(companyId)}/licence-pool`);
}

export async function createPlatformCustomerMember(
  companyId: string,
  body: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    roleId: string;
    reportsToUserId?: string | null;
    regionId?: string | null;
    teamId?: string | null;
    organisationAdmin?: boolean;
    assignLicence?: boolean;
    sendInvitation?: boolean;
  }
) {
  return apiRequest<CompanyMemberDetail>(`/platform/customers/${encodeURIComponent(companyId)}/members`, {
    method: 'POST',
    body,
  });
}

export async function updatePlatformCustomerMember(
  companyId: string,
  memberId: string,
  body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    roleId?: string;
    reportsToUserId?: string | null;
    regionId?: string | null;
    teamId?: string | null;
    isActive?: boolean;
  }
) {
  return apiRequest<CompanyMember>(
    `/platform/customers/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberId)}`,
    { method: 'PATCH', body }
  );
}

export async function deactivatePlatformCustomerMember(companyId: string, memberId: string) {
  return apiRequest<MemberOffboardingResult>(
    `/platform/customers/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberId)}/deactivate`,
    { method: 'POST' }
  );
}

export async function assignPlatformCustomerLicence(companyId: string, memberId: string) {
  return apiRequest<CompanyMember>(
    `/platform/customers/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberId)}/licence`,
    { method: 'POST' }
  );
}

export async function removePlatformCustomerLicence(companyId: string, memberId: string) {
  return apiRequest<CompanyMember>(
    `/platform/customers/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberId)}/licence`,
    { method: 'DELETE' }
  );
}

export async function resendPlatformCustomerInvitation(companyId: string, memberId: string) {
  return apiRequest<{
    sent: boolean;
    email: string;
    channel?: 'mobile' | 'portal';
    activationUrl?: string;
  }>(
    `/platform/customers/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberId)}/resend-invitation`,
    { method: 'POST' }
  );
}

export type AdminAuditEvent = {
  id: string;
  action: string;
  resourceType: string;
  createdAt: string;
  actor: { email: string; name: string };
  companyId: string | null;
  previousValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  difference: number | null;
  reason: string | null;
  targetUserId: string | null;
  invoiceNumber: string | null;
};

export async function listPlatformAudit(filters?: {
  companyId?: string;
  resourceType?: string;
}): Promise<{ events: AdminAuditEvent[] }> {
  const params = new URLSearchParams();
  if (filters?.companyId) params.set('companyId', filters.companyId);
  if (filters?.resourceType) params.set('resourceType', filters.resourceType);
  const query = params.toString();
  return apiRequest<{ events: AdminAuditEvent[] }>(`/platform/audit${query ? `?${query}` : ''}`);
}

export type EnterpriseOnboarding = {
  id: string;
  companyId: string | null;
  commercialStatus: string;
  companyName: string;
  registrationNumber: string | null;
  vatRegistered: boolean;
  vatNumber: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactMobile: string | null;
  billingContactName: string | null;
  billingEmail: string | null;
  billingMobile: string | null;
  orgAdmin: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    mobile: string | null;
    userId: string | null;
    inviteStatus: string;
    hierarchyRoleNotRequired: boolean;
  };
  purchasedLicences: number | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  billingModel: string;
  pricingType: string;
  negotiatedAmountCents: number | null;
  paymentTerms: string | null;
  poReference: string | null;
  internalNotes: string | null;
  extraInvoiceLines: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
  }>;
  contract?: import('../lib/enterpriseContract').EnterpriseContract | null;
  invoicePreview: {
    lines: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
      discountCents: number;
    }>;
    draftInvoiceId: string | null;
    invoiceStatus: string | null;
    editable: boolean;
    numberAllocated: boolean;
  };
  draftInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
  alreadyCommitted?: boolean;
  inviteQueuedLocally?: boolean;
  emailSent?: boolean;
  passwordIssued?: boolean;
  invoice?: InvoiceDetail | null;
};

export async function listEnterpriseOnboardings(): Promise<EnterpriseOnboarding[]> {
  return apiRequest<EnterpriseOnboarding[]>('/platform/enterprise-onboardings');
}

export async function createEnterpriseOnboarding(body: {
  companyName: string;
}): Promise<EnterpriseOnboarding> {
  return apiRequest<EnterpriseOnboarding>('/platform/enterprise-onboardings', {
    method: 'POST',
    body,
  });
}

export async function getEnterpriseOnboarding(id: string): Promise<EnterpriseOnboarding> {
  return apiRequest<EnterpriseOnboarding>(`/platform/enterprise-onboardings/${encodeURIComponent(id)}`);
}

export async function patchEnterpriseOnboarding(
  id: string,
  body: Record<string, unknown>
): Promise<EnterpriseOnboarding> {
  return apiRequest<EnterpriseOnboarding>(`/platform/enterprise-onboardings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  });
}

export async function commitEnterpriseCompany(id: string): Promise<EnterpriseOnboarding> {
  return apiRequest<EnterpriseOnboarding>(
    `/platform/enterprise-onboardings/${encodeURIComponent(id)}/commit-company`,
    { method: 'POST', body: {} }
  );
}

export async function createEnterpriseDraftInvoice(id: string): Promise<{
  onboarding: EnterpriseOnboarding;
  invoice: InvoiceDetail;
  allocatedNewNumber: boolean;
}> {
  return apiRequest(`/platform/enterprise-onboardings/${encodeURIComponent(id)}/draft-invoice`, {
    method: 'POST',
    body: {},
  });
}

export async function queueEnterpriseOrgAdminInvite(id: string): Promise<EnterpriseOnboarding> {
  return apiRequest<EnterpriseOnboarding>(
    `/platform/enterprise-onboardings/${encodeURIComponent(id)}/queue-org-admin-invite`,
    { method: 'POST', body: {} }
  );
}

export async function getEnterpriseContract(companyId: string) {
  return apiRequest<import('../lib/enterpriseContract').EnterpriseContract>(
    `/platform/companies/${encodeURIComponent(companyId)}/enterprise-contract`
  );
}

export async function patchEnterpriseContract(
  companyId: string,
  body: Record<string, unknown>
) {
  return apiRequest<import('../lib/enterpriseContract').EnterpriseContract>(
    `/platform/companies/${encodeURIComponent(companyId)}/enterprise-contract`,
    { method: 'PATCH', body }
  );
}

export async function listEnterpriseContractEvents(companyId: string) {
  return apiRequest<
    Array<{
      id: string;
      contractId: string;
      eventType: string;
      changedFields: Record<string, unknown>;
      actorUserId: string | null;
      note: string | null;
      createdAt: string;
    }>
  >(`/platform/companies/${encodeURIComponent(companyId)}/enterprise-contract/events`);
}

export async function listPlatformOrganisationAdmins(companyId: string) {
  return apiRequest<Array<{ id: string; companyId: string; userId: string; status: string; grantedAt: string }>>(
    `/platform/companies/${encodeURIComponent(companyId)}/organisation-admins`
  );
}

export async function grantPlatformOrganisationAdmin(companyId: string, userId: string) {
  return apiRequest<{ id: string; companyId: string; userId: string; status: string; grantedAt: string }>(
    `/platform/companies/${encodeURIComponent(companyId)}/organisation-admins`,
    { method: 'POST', body: { userId } }
  );
}

export type StaffLicenceIncreaseRequest = {
  id: string;
  companyId: string;
  companyName: string | null;
  currentPurchased: number | null;
  additionalRequested: number;
  proposedTotal: number | null;
  status: string;
  statusLabel?: string;
  billingTreatment: string | null;
  billingTreatmentLabel: string | null;
  requestedByName: string | null;
  requestedAt: string;
  notes: string | null;
  decisionNotes: string | null;
  assigned?: number;
  available?: number | null;
  alreadyApplied?: boolean;
  conflict?: { current: number | null; expected: number | null } | null;
};

export async function listPlatformLicenceRequests(): Promise<{ requests: StaffLicenceIncreaseRequest[] }> {
  return apiRequest<{ requests: StaffLicenceIncreaseRequest[] }>('/platform/licence-requests');
}

export async function getPlatformLicenceRequest(requestId: string): Promise<StaffLicenceIncreaseRequest> {
  return apiRequest<StaffLicenceIncreaseRequest>(`/platform/licence-requests/${encodeURIComponent(requestId)}`);
}

export async function approvePlatformLicenceRequest(
  requestId: string,
  body?: { notes?: string | null; amountCents?: number | null }
): Promise<StaffLicenceIncreaseRequest> {
  return apiRequest<StaffLicenceIncreaseRequest>(
    `/platform/licence-requests/${encodeURIComponent(requestId)}/approve`,
    { method: 'POST', body: body ?? {} }
  );
}

export async function rejectPlatformLicenceRequest(
  requestId: string,
  notes?: string | null
): Promise<StaffLicenceIncreaseRequest> {
  return apiRequest<StaffLicenceIncreaseRequest>(
    `/platform/licence-requests/${encodeURIComponent(requestId)}/reject`,
    { method: 'POST', body: { notes: notes ?? null } }
  );
}
