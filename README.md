# PAWS Egypt

Premium pet lifestyle brand for Cairo — Next.js 15 app with Supabase backend.

**Live site:** [pawsegypt.com](https://pawsegypt.com)

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **i18n:** next-intl (Arabic / English, RTL-aware)
- **Backend:** Supabase (Postgres, Auth, Storage, RLS)
- **Hosting:** Hostinger (CDN + origin)
- **State:** Zustand (cart, UI)

## Getting Started

```bash
npm install
cp .env.example .env.local    # then fill in Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/[locale]/          # App Router — (website) group for public, (dashboard) for admin
├── components/            # website/, dashboard/, ui/ (shadcn primitives)
├── i18n/                  # next-intl config
├── lib/supabase/          # client + server helpers
└── stores/                # Zustand cart store

scripts/
├── seed-blog-articles.ts      # seed blog content
├── seed-products.ts           # demo product seed (superseded by pos-products-export.xlsx)
├── import-pos-products.ts     # imports the 341-product POS catalog
├── pos-products-export.xlsx   # source of truth for products
└── translate-products.py      # Arabic translation rules for product names

supabase/migrations/       # DDL, RLS policies, catalog enrichment
messages/                  # en.json, ar.json — next-intl message catalogs
```

## Database

Project ID: `shxnczbvtitnnxyxkkyf`. All schema changes tracked in
`supabase/migrations/`. Run the Supabase CLI to apply locally, or use the
Supabase dashboard SQL editor.

## Deploy

Site builds with `npm run build` and is deployed to Hostinger. Output is
a standard Next.js production bundle (`.next/`) served behind Hostinger's
CDN with the panel's Node.js runtime.
