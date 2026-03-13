This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Track your daily sales in seconds.**

A daily profit tracker for small business owners — log sales and expenses in under 60 seconds and instantly see your profit.

---

## Stack

| Component | Version |
|-----------|---------|
| Next.js | 16 (Turbopack) |
| React | 19 |
| TypeScript | Strict mode |
| Prisma | 7 (PostgreSQL) |
| NextAuth | v5 beta |
| Tailwind CSS | v4 |
| shadcn/ui | v4 |
| Recharts | 3 |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

The `.env.local` file is included with defaults for local dev. Update `NEXTAUTH_SECRET` for production:

```bash
# .env.local
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-here"       # openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"   # keep same value for compatibility
# Optional AI summary provider (Smart Daily Summary)
AI_PROVIDER="groq"                    # "groq" or "gemini"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.1-8b-instant"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
```

### 3. Run database migration

```bash
npx prisma db push
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Prisma Commands

```bash
npx prisma studio          # Visual DB browser at localhost:5555
npx prisma migrate reset   # Wipe DB and re-run all migrations
npx prisma generate        # Regenerate client after schema change
```

---

## Features

- **Register / Login** — mobile number + password auth with bcrypt hashing
- **Log Sales** — quick number input with ₱ prefix, optional note
- **Log Expenses** — label + amount with suggested label chips
- **Today's Profit** — prominently displayed with pulsing green dot
- **7-Day Chart** — Recharts bar chart showing profit vs expenses
- **30-Day History** — browse all past entries by date
- **Settings** — update business name
- **Mobile-first** — full bottom nav, 44px min tap targets
- **Responsive** — sidebar on desktop, bottom nav on mobile
