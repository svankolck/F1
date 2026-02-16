# Vercel Deployment Guide

To deploy this application to Vercel, follow these steps:

## 1. Environment Variables
Add the following environment variables to your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Project Anon Key |

## 2. Supabase Configuration (CRITICAL)
You MUST update your Supabase Auth settings to allow Vercel to handle redirects:

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** > **URL Configuration**.
3.  Update **Site URL** to your Vercel production URL (e.g., `https://f1-app.vercel.app`).
4.  Add your Vercel development and preview URLs to **Redirect URLs**:
    *   `http://localhost:3000/**` (for local development)
    *   `https://*-your-username.vercel.app/**` (for Vercel previews)
    *   `https://your-domain.vercel.app/**` (for production)

## 3. Database Migrations
Ensure all migrations in `supabase/migrations/` have been applied to your **production** Supabase project.

## 4. Next.js Config
The `next.config.mjs` is already configured to allow Supabase image domains. If you use a custom domain for Supabase, ensure it is added to the `remotePatterns` in `next.config.mjs`.
