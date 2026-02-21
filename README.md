# Recipe Manager

A personal recipe manager and weekly meal planner built with Next.js, Prisma, and Supabase.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgiulioprinaricotti%2Frecipe-manager&env=DATABASE_URL,DIRECT_URL,NEXTAUTH_SECRET,UNSPLASH_ACCESS_KEY&envDescription=See%20the%20README%20for%20how%20to%20obtain%20each%20value&envLink=https%3A%2F%2Fgithub.com%2Fgiulioprinaricotti%2Frecipe-manager%23environment-variables)

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- (Optional) An [Unsplash](https://unsplash.com/developers) API key for the cover image picker

## Supabase setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Project Settings > Database**
3. Under **Connection string**, grab both:
   - **Transaction pooler** (port `6543`) — this is your `DATABASE_URL`
   - **Session pooler** (port `5432`) — this is your `DIRECT_URL`

Both strings look like:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:[port]/postgres
```

Append `?pgbouncer=true` to the `DATABASE_URL` (port 6543) only.

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (port 6543, with `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection string (port 5432) |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL (`http://localhost:3000` for local dev) |
| `UNSPLASH_ACCESS_KEY` | Unsplash API access key (optional) |

## Local development

```bash
# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env

# Push the database schema to Supabase
npx prisma db push

# Create your first user
npx tsx scripts/create-user.ts your@email.com "Your Name" yourpassword

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Deploy to Vercel

1. Click the **Deploy with Vercel** button above
2. Fill in the environment variables when prompted
3. After the deploy succeeds, push the database schema from your local machine:
   ```bash
   # Point DIRECT_URL at your production Supabase database
   DATABASE_URL="..." DIRECT_URL="..." npx prisma db push
   ```
4. Create a user the same way:
   ```bash
   DATABASE_URL="..." npx tsx scripts/create-user.ts your@email.com "Your Name" yourpassword
   ```
