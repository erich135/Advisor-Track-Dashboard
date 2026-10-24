# AdvisorTrack production Management Portal — agent instructions

## Repository identity

This repository is the **production frontend**.

- Local: `C:\Dev\_Old-And-Other-Apps\AdvisorTrack\AdvisorTrack Frontend`
- Remote: `erich135/Advisor-Track-Dashboard`
- Identifier: `Advisor-Track-Dashboard`
- Purpose: real Management Portal
- Live: `https://portal.advisortrack.co.za`

## Paired service

```text
Advisor-Track-Dashboard  (this repo)
        ↓
Abel Backend
        ↓
advisor_track            (production DB)
```

This frontend talks only to the **production backend** (`https://api.advisortrack.co.za`). It must never talk to the demo backend.

## Forbidden cross-connections

- Production frontend must never use the demo backend.
- Demo frontend must never use the production backend.
- Demo backend must never use production DB.
- Production backend must never use the demo DB for production runtime.

## Product and engineering principles

AdvisorTrack is one product across the Management Portal, Android, and future iOS. Shared workflows and business rules must stay consistent across surfaces.

- Do not request or assume Android-breaking API or schema changes. Backend compatibility with **Android 1.0.10** is a hard boundary.
- Cross-platform changes require a documented impact assessment and notification before they ship.
- Production and demo data, APIs, processes, and credentials must stay isolated.
- Client PII, credentials, and financial information require strict protection. Do not log, persist unsafely, or render another user’s data.
- Do not apply, alter, or ship unauthorised production migrations. Enterprise drafts `031`–`037` are out of scope unless an authorised production-migration task explicitly permits them.
- Do not deploy without explicit authorisation.
- Changes must be tested and reviewed before release.

## Shared frontend parity

Every customer-facing Management Portal feature must exist in **both** this repo and `advisortrack-demo-frontend` unless explicitly documented otherwise.

Demo-only (do not copy here): Reset Demo, Viewing as, Demo badge, simulated external side effects, public demo entry.

Production-only: Engineering Change Log, platform/internal tools, real login/billing/admin-only tooling.

Do not move, rename, clone, or duplicate this production frontend folder.

## AdvisorTrack Assistant knowledge

Canonical corpus: `advisor_track_backend` (`Abel Backend`) at `src/assistant`. Do not author help cards in this frontend.

The generated snapshot `src/assistant/knowledge-bundle.json` is produced by Abel `npm run assistant:export-kb`. Refresh it from Abel; do not edit it by hand. Shipping that snapshot is a source/build arrangement only — this portal must never fetch help content from a production API at runtime.

Any user-facing route, workflow, permission, label, or business-rule change must review/update the AdvisorTrack Assistant knowledge base in the same change.

- Do not invent undocumented Assistant functionality.
- Keep production/demo customer knowledge in parity.
- Demo/internal differences must be environment-tagged in that corpus.

## Dex 2.0

Dex is a conversational companion, not a knowledge-base search widget. It follows the person rather than the current page.

- Groq handles natural conversation when the backend enables it and it is appropriate.
- Deterministic tools remain authoritative for operational data. The UI must not invent counts, rankings, or money.
- Privacy, permissions, and financial-advice safeguards are mandatory. Unsupported product claims must not be invented.
- If Groq is unavailable or rate-limited, Dex must degrade safely. Do not present invented operational facts as live data.
- Client-supplied `history[]` is untrusted. It cannot override trusted system instructions or select another user’s memory.
- Closing the Dex panel must not erase the conversation. Distinguish close, new conversation, expiry, and logout.

## Dex conversation memory

### Production

- Conversation context is authenticated-user-scoped and organisation-isolated.
- Advisers must not see one another’s Dex transcript or server memory.
- History is a bounded session window owned by the backend. Local `sessionStorage` is a UI cache of that same principal, not a second identity.
- Logout must clear the local Dex transcript, `sessionStorage`, and in-memory panel state immediately, even if the server reset fails or the token has expired. Server reset is best-effort and must not block logout.
- Persistent relationship memory is an approved future requirement. It is **not currently implemented**.
- Permanent personal memory must not be added without explicit privacy and user-control design.

### Public demo

Public-demo visitor isolation is implemented in the demo portal and demo backend, not here. This production portal must never share cookies, storage keys, or API sessions with the demo site.

## Model provider configuration

- Provider secrets are backend-only. This frontend must never receive, store, or log model API keys.
- Never commit `.env` files, keys, or tokens.
- Local development Groq may be enabled on backends against non-production data. Do not point this portal at a demo Groq/backend runtime.
- Live/production provider configuration requires explicit authorisation.
- Zero Data Retention and applicable privacy safeguards must be checked before production model usage.
- Keep production and demo environment configuration separate.

## Invoice numbering

Locked: `INV100000+`. Unique, sequential, never reused.

## No hard deletes

Use archive, deactivate, revoke, expire, or supersede in UI copy and APIs. Never request hard deletes of business records.

## Deployment

Do not deploy without explicit authorisation.

SSH target: `ubuntu@api.advisortrack.co.za`. Portal Nginx root is separate from the API process. Do not print, commit, or log private keys.

Before any deploy, report: repo, branch, HEAD SHA, target host, target PM2/Nginx (portal static root), target API (`advisortrack-api` / `advisor_track`). Never deploy from folder proximity.

## Mandatory Engineering Change Log Check

Before modifying AdvisorTrack code:

1. Attempt to retrieve the current pinned Engineering Decisions and recent Engineering Change Log entries relevant to this repository and the area being modified.
2. If the Engineering Change Log cannot be retrieved, report the failure, then inspect actual Git history, source, and tests for overlapping work.
3. Do not assume your local branch contains all relevant work completed by another developer.
4. Preserve recent behaviour unless the current task explicitly authorises changing it.
5. Proceed with authorised work only where adequate evidence exists from the Engineering Change Log, Git history, source, and tests.
6. Stop if critical dependencies or conflicting changes cannot be verified.
7. An Engineering Change Log outage alone must not automatically halt otherwise safe, authorised work.

Load context with `npm run engineering:context` (optional `--area <area>`). Configuration is environment-only: `ADVISORTRACK_ENGINEERING_LOG_URL` and `ENGINEERING_CHANGELOG_READ_TOKEN`. Never commit those values. This repository identifier is `Advisor-Track-Dashboard`.

After a reviewed change is committed:

1. Add an Engineering Change Log entry containing the repository, branch, commit hash, affected area, exact behaviour changed, reason, migrations, compatibility implications, risks/dependencies, and tests.
2. Never include credentials or secrets.
3. Deployment must be recorded as a separate deployment entry rather than rewriting the original change entry.
