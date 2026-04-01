# Momentum

Habit tracking app with streaks, analytics, and daily completion logs.

## Stack

- **Frontend** — React 18 + Vite, Tailwind CSS
- **Backend** — Express, Prisma ORM, PostgreSQL (Supabase)
- **Auth** — JWT, Google OAuth, GitHub OAuth

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (or any PostgreSQL instance)
- Google and/or GitHub OAuth app credentials (optional — email/password works without them)

## Setup

**1. Install dependencies**

```bash
cd server && npm install
cd ../client && npm install
```

**2. Configure the server**

Copy the example and fill in your values:

```bash
cp server/.env.example server/.env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random string, min 32 chars — signs auth tokens |
| `SESSION_SECRET` | Separate random string — signs OAuth session cookies |
| `CLIENT_URL` | Frontend origin, e.g. `http://localhost:5173` |
| `SERVER_URL` | Backend origin, e.g. `http://localhost:5000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console (optional) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | From GitHub Developer Settings (optional) |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**3. Run database migrations**

```bash
cd server && npx prisma migrate dev
```

**4. (Optional) Seed demo data**

```bash
cd server && npm run db:seed
# Creates demo@momentum.app / demo1234 — development only, blocked in production
```

## Running locally

```bash
# Terminal 1 — backend (port 5000)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Running tests

```bash
# From the project root — requires the frontend dev server to be running
npx playwright test
```
