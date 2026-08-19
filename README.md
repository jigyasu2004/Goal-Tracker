# Northstar

Northstar is a full-stack goal and habit tracker built to turn long-term intention into clear daily action. It combines a progress calendar, recurring habits, gentle streaks, weekly consistency, and linked reflections in one responsive workspace.

**Live demo:** [goal-tracker-cyan.vercel.app](https://goal-tracker-cyan.vercel.app/)

## Features

- **Daily compass** — opens on today and surfaces the next incomplete action.
- **Tasks, habits, and goals** — plan one-time actions or repeat them on selected weekdays.
- **Momentum dashboard** — see daily completion, current streak, seven-day consistency, and active goals.
- **Progress calendar** — scan completion history and open any day to plan or reflect.
- **Linked reflections** — save notes generally, for a specific date, or alongside a goal.
- **Timezone-aware reminders** — optional nightly reminder and completion emails.
- **Responsive and accessible** — keyboard focus states, reduced-motion support, and layouts for phone through desktop.
- **Account isolation** — every goal and note mutation is scoped to the authenticated user.

## Stack

- Next.js 15 App Router and TypeScript
- React 18 and Tailwind CSS
- PostgreSQL with Prisma
- NextAuth.js credentials authentication
- Nodemailer and node-cron for optional reminders

## Local setup

```bash
git clone https://github.com/jigyasu2004/Goal-Tracker.git
cd Goal-Tracker
npm install
```

Create `.env`:

```env
DATABASE_URL="your_postgres_connection_string"
NEXTAUTH_SECRET="a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional email reminders
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# Required only if calling the protected scheduler endpoint
CRON_SECRET="another-long-random-secret"
```

Prepare the database and start the app:

```bash
npx prisma migrate deploy
npm run dev
```

## Verification

```bash
npm run lint
npx tsc --noEmit
npx next build
npm audit --omit=dev
```

## License

This project is available under the MIT License.
