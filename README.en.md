# Agenda Easy 🇮🇹

> **Full agenda, WhatsApp at peace.** Online booking SaaS for any appointment-based business — barbershops, salons, beauticians, tattoo artists, physiotherapists and more — with a product showcase and editable plans/promotions.

🇮🇹 **[Versione italiana](README.md)**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-087EA4?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

The client picks service, professional and time on their own and the booking lands in the agenda **already confirmed** — payment happens on site. The business can also showcase the **products** it sells and create **tailored plans and promotions** (monthly subscription, quiet-day discounts, "bring 3 friends", bundles…), all editable for any niche. **Bilingual UI (Italian/English)**, **EUR** currency, **Europe/Rome** timezone.

---

## 🎥 Demo

**[▶ Watch the demo video](docs/media/demo.webm)** — landing, language switch, booking flow and onboarding.

| Landing (Italian) | Landing (English) |
|---|---|
| ![Landing IT](docs/media/01-landing-it.png) | ![Landing EN](docs/media/02-landing-en.png) |

| Public booking page | Picking a time |
|---|---|
| ![Booking](docs/media/03-prenotazione.png) | ![Slots](docs/media/04-orari.png) |

| Sign in | Business onboarding |
|---|---|
| ![Login](docs/media/05-login.png) | ![Onboarding](docs/media/06-onboarding.png) |

---

## ✨ Features

- **Personalised public page** for every business (`agendaeasy.it/your-business`): logo, cover, brand colour, services with photos
- **Instantly confirmed bookings**: no upfront payment, the client pays on site; self-service cancellation up to 2h before
- **Product showcase**: besides bookable services, the business displays the products it sells (photo, price, description)
- **Editable plans & promotions**: monthly subscription, midweek discount, "bring 3 friends", bundles — quick prefilled templates, every field customisable, for any niche
- **Daily agenda + monthly calendar** in the dashboard, with statuses (confirmed, completed, cancelled, no-show)
- **Team and shifts per professional**, real opening hours and breaks (e.g. lunch)
- **Monthly report**: expected revenue, most booked services
- **Transactional e-mails** (confirmation + 24h reminder) in the client's language, with a secure cancellation link (up to 2h before)
- **SaaS subscription via Stripe**: Checkout (€9.90/month, 7-day trial), lifecycle webhooks, Customer Portal
- **Bilingual it/en** with a persistent 🇮🇹/🇬🇧 switcher (cookie, 1 year) on every page — e-mails included
- **Sign in with Google** or e-mail/password (Supabase Auth)

## 🧱 Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 16 (App Router, Server Components, Server Actions, Turbopack) |
| UI | React 19 · Tailwind CSS 4 · GSAP |
| Database / Auth / Storage | Supabase (Postgres 17 + RLS, Auth, Storage) |
| Payments | Stripe (Checkout subscription, Webhooks, Customer Portal) |
| E-mail | Resend |
| Validation | Zod (every mutation validated on the server) |
| Hosting | Vercel (including the daily reminders cron) |

## 🗺️ Architecture

```mermaid
flowchart LR
    C[End client<br/>browser] -->|books| N
    T[Owner<br/>dashboard /app] -->|manages| N

    subgraph Vercel
        N[Next.js 16<br/>SSR · Server Actions · API routes]
        CRON[Cron 06:00 UTC<br/>/api/cron/reminders]
    end

    N -->|RLS + session| SB[(Supabase<br/>Postgres · Auth · Storage)]
    N -->|service role<br/>server only| SB
    N -->|Checkout / Portal| ST[Stripe]
    ST -->|signed webhook| N
    N -->|e-mail it/en| RS[Resend]
    CRON --> SB
    CRON --> RS
```

## 📐 UML

### Data model (ER)

```mermaid
erDiagram
    BUSINESSES ||--o{ BUSINESS_MEMBERS : "has"
    BUSINESSES ||--o{ SERVICES : "offers"
    BUSINESSES ||--o{ PLANS : "promotes"
    BUSINESSES ||--o{ PROFESSIONALS : "employs"
    BUSINESSES ||--o{ BUSINESS_HOURS : "opens"
    BUSINESSES ||--o{ BREAKS : "pauses"
    BUSINESSES ||--o{ CUSTOMERS : "serves"
    BUSINESSES ||--|| SUBSCRIPTIONS : "subscription"
    PROFESSIONALS ||--o{ PROFESSIONAL_SHIFTS : "shifts"
    CUSTOMERS ||--o{ APPOINTMENTS : "books"
    SERVICES ||--o{ APPOINTMENTS : "subject of"
    PROFESSIONALS ||--o{ APPOINTMENTS : "performs"

    BUSINESSES {
        uuid id PK
        text slug UK
        text name
        text timezone "Europe/Rome"
        text country_code "IT"
        bool published
    }
    SERVICES {
        uuid id PK
        text item_type "service|product"
        int price_minor "cents"
        text currency "EUR"
        int duration_minutes "services only"
        bool active
    }
    PLANS {
        uuid id PK
        text title
        text description
        int price_minor "optional"
        text price_suffix "e.g. /month"
        text badge "e.g. Deal"
        bool active
        int sort_order
    }
    APPOINTMENTS {
        uuid id PK
        timestamptz starts_at "UTC"
        text status "confirmed, completed, cancelled, no_show"
        int service_price_minor "snapshot"
        uuid cancel_token "cancellation link"
        text lang "it|en"
    }
    SUBSCRIPTIONS {
        uuid business_id PK
        text stripe_customer_id
        text stripe_subscription_id
        text status "trialing|active|past_due|canceled"
        timestamptz trial_ends_at
    }
```

### Sequence: public booking

```mermaid
sequenceDiagram
    actor C as Client
    participant P as Page /[slug]
    participant A as POST /api/public/bookings
    participant DB as Supabase (atomic RPC)
    participant R as Resend

    C->>P: picks service, professional, date and time
    P->>A: booking request (Zod validates)
    A->>DB: recomputes availability NOW
    A->>DB: create_booking() — exclusion constraint settles races
    DB-->>A: appointment (confirmed) + cancel_token
    A->>R: confirmation e-mail in the client's language
    A-->>C: booking confirmed + cancellation link (up to 2h before)
    Note over C,DB: no deposit — payment happens on site
```

### Sequence: Stripe subscription

```mermaid
sequenceDiagram
    actor T as Owner
    participant B as /app/billing (Server Action)
    participant S as Stripe
    participant W as /api/webhooks/stripe
    participant DB as Supabase

    T->>B: "Subscribe now"
    B->>S: Checkout Session (subscription, remaining trial)
    S-->>T: Stripe payment page
    T->>S: pays (card, SEPA, ...)
    S->>W: checkout.session.completed / invoice.paid (verified signature)
    W->>DB: subscriptions.status = active
    Note over T,DB: renewals, failures and cancellations arrive via webhook;<br/>self-service management goes through the Customer Portal
```

## 📂 Project structure

```
src/
├── app/
│   ├── page.tsx              # bilingual landing
│   ├── [slug]/               # public page: booking + plans + products
│   ├── annulla/[id]/         # cancellation via cancel_token
│   ├── app/                  # dashboard (agenda, services/products, plans, team, hours, report, settings)
│   │   └── billing/          # Stripe subscription (checkout + portal)
│   └── api/
│       ├── public/           # availability + bookings (server is the authority)
│       ├── webhooks/stripe/  # subscription lifecycle
│       └── cron/reminders/   # 24h reminders (Vercel Cron)
├── components/               # language switcher, support chat, auth forms
└── lib/
    ├── i18n/                 # it/en via cookie (server + client + action messages)
    ├── availability/         # slot engine (shifts ∩ hours − breaks − busy)
    ├── billing/              # plan, trial, access policy
    ├── dates/ money/         # Intl it-IT/en-GB, EUR in cents
    └── supabase/ stripe/     # typed clients (session / admin / stripe)
supabase/migrations/          # full schema + RLS + hardening (14 migrations)
```

## 🚀 Local setup

```bash
npm install
cp .env.example .env.local    # fill in the keys (see table)
npx supabase link --project-ref <ref> && npx supabase db push
npm run dev                   # http://localhost:7778
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project |
| `SUPABASE_SECRET_KEY` | service role — server only |
| `NEXT_PUBLIC_SITE_URL` | `https://agendaeasy.it` in production |
| `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` | SaaS subscription |
| `RESEND_API_KEY` / `EMAIL_FROM` | transactional e-mails |
| `CRON_SECRET` | protects the reminders cron |

Stripe webhooks locally: `stripe listen --forward-to localhost:7778/api/webhooks/stripe`

## 🔒 Security

- **Per-tenant RLS** on every table + column grants for `anon` (phone numbers and client data are never publicly readable)
- **The server is the authority**: prices, durations and availability always recomputed server-side; concurrent bookings settled by a Postgres exclusion constraint
- **Stripe webhook** verified on the raw body signature, fail-closed without the secret
- **Cancellation** authenticated by a per-booking secret token, with a 2h limit
- Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)

## 🗺️ Roadmap

See the [Issues](../../issues) for the roadmap: automatic VAT with Stripe Tax, rate limiting, CSP, E2E tests in CI and more.

## 📄 License

[MIT](LICENSE) — Developed by **[Kallebe Gallo](https://github.com/kallebesiqueira-dev)**
