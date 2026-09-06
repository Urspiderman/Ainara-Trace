# AINARA Trace — Next.js + Supabase + Vercel

Prototype SaaS dashboard for AINARA's recycled-gold traceability concept.

## Stack
- Next.js App Router + TypeScript
- Supabase Postgres + Realtime
- Vercel deployment target
- Lucide icons
- Server-side chatbot route using the OpenAI Responses API

## Run locally
1. Copy `.env.example` to `.env.local`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Add `OPENAI_API_KEY` for full chatbot mode. Without it, the chatbot still shows a helpful setup message.
4. Run `npm install` then `npm run dev`.

## Supabase
Run `supabase/schema.sql` in the Supabase SQL Editor. The schema includes tables for suppliers, gold batches, and trace events plus Realtime publication setup. Tighten RLS policies before production.

## Vercel
Deploy the repository, then add the same environment variables in Vercel Project Settings. Do not expose the OpenAI key with `NEXT_PUBLIC_`.

## Prototype scope
Included screens: Overview, Gold Batches, Suppliers, Documents, Reports, responsive mobile navigation, and an AINARA Assistant chatbot. Demo data is used when Supabase is not configured; once Supabase is connected, the app loads and listens for Realtime changes to suppliers and gold batches.
