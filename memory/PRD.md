# PRD — 4à4 dix-huit Association Website

## Original problem statement
Build a bilingual (French / English) web application for the French neighborhood association **4à4 dix-huit — Amiraux Simplon Championnet Poissonniers** (Paris 18e). The site must convey a professional, warm, dynamic, human and accessible image. All pages must be configurable from an admin interface. Donations go to a HelloAsso URL configured from admin. Media is uploaded (not localstorage). URL: 4a4dixhuit.org. Contact: contact@4a4dixhuit.org.

## User personas
- **Visitor / parent / neighbor** — browses pages in FR or EN, signs up as a member, contacts the association, donates via HelloAsso.
- **Administrator** — single admin role, manages all content (pages, events, news, gallery, members, messages, settings) from `/admin`.

## Architecture
- **Frontend** — React (CRA) + React Router + TailwindCSS + sonner toasts + lucide-react icons. Fonts: Poppins (headings), Open Sans (body), Caveat (handwritten accents). Brand colors: #39B8B2, #E6DD08, #B63CCC, #D91012, #444444, #F7F7F7.
- **Backend** — FastAPI + Motor (MongoDB). All routes prefixed `/api`. JWT auth (bcrypt + PyJWT). Emergent object storage for uploaded media.
- **Database** — MongoDB with collections: users, pages, events, news, gallery, members, messages, settings, files.

## Core requirements (static)
1. 10 public pages: Accueil, À propos, Nos actions, Événements, Actualités, Galerie photos/vidéos, Devenir membre, Faire un don (HelloAsso), Contact, Mentions légales, Politique de confidentialité.
2. Bilingual (FR / EN) with language switcher and translations stored per language per page.
3. Admin CMS for every page, events CRUD, news CRUD, gallery (upload + external URL), members, messages, settings.
4. JWT custom auth (admin only).
5. Media via Emergent object storage (no localstorage).
6. Don button = HelloAsso URL configurable from admin.

## What's been implemented (2026-06-26)
- Backend (server.py)
  - JWT auth (POST /api/auth/login, GET /api/auth/me, POST /api/auth/change-password)
  - Admin seeded from env on startup (idempotent)
  - Pages CRUD (8 default slugs seeded with French content from association documents + English translation)
  - Events CRUD (with published flag, bilingual fields)
  - News CRUD (with excerpt and body, bilingual)
  - Gallery CRUD (image/video, external URL or upload via storage)
  - Members signup (public POST, admin list/delete)
  - Contact messages (public POST, admin list/read/delete)
  - Settings (helloasso_url, contact info, socials, logo, SEO meta, site_url) — GET merges defaults so old DB docs auto-pick up new fields
  - File upload via Emergent object storage + /api/files/{path} stream
  - Resend email integration (skipped silently if RESEND_API_KEY empty — current state)
  - /api/sitemap.xml and /api/robots.txt (SEO)
- Frontend
  - 10 public pages with brand-charter design + SEO meta tags via react-helmet-async (unique title and description per page, OpenGraph + Twitter Card)
  - Configurable logo (settings.logo_url) used in header, footer, and as favicon
  - Header with sticky nav, mobile menu, language toggle
  - Footer with quick links, contact info, configurable social icons (Facebook, Instagram, X/Twitter, LinkedIn, YouTube, TikTok, WhatsApp — only shown if URL configured), donate CTA
  - Member form, contact form, gallery lightbox with FR/EN filters
  - News articles render rich HTML body (Quill-produced markup) safely
  - Login page + admin layout (sidebar nav + main outlet)
  - Admin Dashboard with stat cards
  - Admin PageEditor (structured + JSON editing modes, FR/EN tabs)
  - Admin Events CRUD; Admin News CRUD with **rich-text editor** (react-quill-new, React 19 compatible) for body FR/EN
  - Admin Gallery/Members/Messages CRUDs
  - Admin Settings (logo upload, site URL, meta descriptions FR/EN, HelloAsso URL, contact info, 7 social URLs, password change)
- Testing
  - 50 pytest backend tests — 100% pass
  - Full Playwright e2e — 100% pass (after Quill fix)

## Prioritized backlog
- **P1** Add Resend API key → end-to-end contact email
- **P2** Add image lazy loading + thumbnails for gallery
- **P2** Newsletter signup (separate from member form)
- **P3** Cache headers on /api/files for media performance
- **P3** Production redirect /sitemap.xml → /api/sitemap.xml at the host level (for SEO crawlers when deployed at 4a4dixhuit.org)

## Next tasks (immediate)
1. User provides Resend API key → wire up real contact emails.
2. Optional: connect production HelloAsso campaign URL.
3. Optional: real photos and videos uploaded by the association via admin.
