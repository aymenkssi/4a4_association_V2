# PRD — 4à4 dix-huit (Association Site) — Preview Import

## Original Problem Statement
Import existing repo `aymenkssi/4a4_association_V2` and get it running in a reachable
preview: backend healthy, admin login working, homepage rendering. Email + upload flows
configured but treated as "wired, not verified".

## Architecture
- Frontend: React 19 (CRA + craco), react-router-dom 7, react-helmet-async, react-quill-new,
  tailwind, shadcn/ui. Public site + `/admin` back-office.
- Backend: FastAPI (0.141.1) single `server.py`, JWT auth, motor/pymongo (MongoDB),
  Resend email via HTTP (`requests`), local file uploads to `UPLOAD_DIR`.
- DB: MongoDB local, DB_NAME=test_database.

## User Personas
- Public visitor (association site: actualités, événements, galerie, dons, adhésion, contact).
- Admin (back-office: pages, events, news, gallery, members, users, messages, newsletters, settings).

## Done (2026-06)
- Cloned repo into /app; installed backend requirements + frontend yarn deps.
- Wrote backend/.env (JWT_SECRET generated for preview, ADMIN_PASSWORD set, RESEND empty),
  kept frontend REACT_APP_BACKEND_URL preview origin.
- Created UPLOAD_DIR=/app/uploads. MongoDB running. Admin auto-seeds on startup.
- Verified: `/api/` health OK, admin login returns JWT, homepage renders + calls backend,
  RGPD cookie banner shows, admin dashboard/back-office loads.

## Wired, NOT verified
- Resend email (contact/adhésion) — RESEND_API_KEY empty. Set key + E2E test when requested.
- File upload flow — not exercised E2E; UPLOAD_DIR ephemeral in preview.

## Hardening backlog (before real launch)
- P0: Rotate RESEND_API_KEY, JWT_SECRET, ADMIN_PASSWORD (owner handling).
- P1: Lock CORS to real domain (currently `*`); rename DB from test_database.
- P2: Confirm upload persistence / move to object storage if needed.
