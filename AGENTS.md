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

## Shared frontend parity

Every customer-facing Management Portal feature must exist in **both** this repo and `advisortrack-demo-frontend` unless explicitly documented otherwise.

Demo-only (do not copy here): Reset Demo, Viewing as, Demo badge, simulated external side effects, public demo entry.

Production-only: Engineering Change Log, platform/internal tools, real login/billing/admin-only tooling.

## AdvisorTrack Assistant knowledge

Canonical corpus: `advisor_track_backend` (`Abel Backend`) at `src/assistant`. Do not author help cards in this frontend.

The generated snapshot `src/assistant/knowledge-bundle.json` is produced by Abel `npm run assistant:export-kb`. Refresh it from Abel; do not edit it by hand. Shipping that snapshot is a source/build arrangement only — this portal must never fetch help content from a production API at runtime.

Any user-facing route, workflow, permission, label, or business-rule change must review/update the AdvisorTrack Assistant knowledge base in the same change.

- Do not invent undocumented Assistant functionality.
- Keep production/demo customer knowledge in parity.
- Demo/internal differences must be environment-tagged in that corpus.

## Invoice numbering

Locked: `INV100000+`. Unique, sequential, never reused.

## No hard deletes

Use archive, deactivate, revoke, expire, or supersede in UI copy and APIs. Never request hard deletes of business records.

## AdvisorTrack AWS key (operator note only)

Working copy: `C:\Users\erich.ERICHPC\.ssh\advisortrack-main.pem`  
SSH target: `ubuntu@api.advisortrack.co.za`

Do not print, commit, or log the key. Portal Nginx root is separate from the API process.

## Deployment checklist

Before any deploy, report: repo, branch, HEAD SHA, target host, target PM2/Nginx (portal static root), target API (`advisortrack-api` / `advisor_track`). Never deploy from folder proximity.

## Mandatory Engineering Change Log Check

Before modifying AdvisorTrack code:

1. Read the current pinned Engineering Decisions.
2. Read recent Engineering Change Log entries relevant to this repository and the area being modified.
3. Inspect any referenced commits that overlap the proposed work.
4. Do not assume your local branch contains all relevant work completed by another developer.
5. Preserve recent behaviour unless the current task explicitly authorises changing it.
6. If Engineering Change Log context cannot be retrieved, STOP and report that the mandatory pre-change check could not be completed rather than proceeding blindly.

Load context with `npm run engineering:context` (optional `--area <area>`). Configuration is environment-only: `ADVISORTRACK_ENGINEERING_LOG_URL` and `ENGINEERING_CHANGELOG_READ_TOKEN`. Never commit those values. This repository identifier is `Advisor-Track-Dashboard`.

After a reviewed change is committed:

1. Add an Engineering Change Log entry containing the repository, branch, commit hash, affected area, exact behaviour changed, reason, migrations, compatibility implications, risks/dependencies, and tests.
2. Never include credentials or secrets.
3. Deployment must be recorded as a separate deployment entry rather than rewriting the original change entry.
