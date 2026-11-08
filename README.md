# NPURE SO — Stock Opname System

Sistem stock opname personal untuk brand kosmetik NPURE.

## Tech Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (PostgreSQL + Auth + Storage)
- PWA (offline-first, installable on iOS/Android)
- Glassmorphism pink theme

## Setup

1. Clone this repo
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
   TZ=Asia/Jakarta
   ```
3. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```
4. Run dev server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```
5. Open http://localhost:3000

## Deploy to Vercel
1. Push to GitHub
2. Import repo to Vercel
3. Add environment variables (same as .env.local)
4. Deploy

## Architecture
See `NPURE_SO_Architecture.html` for full blueprint.
