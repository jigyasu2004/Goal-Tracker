# Northstar

Northstar is a full-stack goal and habit tracker built to turn long-term intention into clear daily action. It combines a progress calendar, recurring habits, gentle streaks, weekly consistency, and linked reflections in one responsive workspace.

**Live demo:** [goal-tracker-cyan.vercel.app](https://goal-tracker-cyan.vercel.app/)

**Android app:** [Download the latest APK](https://github.com/jigyasu2004/Goal-Tracker/releases/latest/download/Northstar-1.0.0.apk)

## Features

- **Daily compass** — opens on today and surfaces the next incomplete action.
- **Tasks, habits, and goals** — plan one-time actions or repeat them on selected weekdays.
- **Momentum dashboard** — see daily completion, current streak, seven-day consistency, and active goals.
- **Progress calendar** — scan completion history and open any day to plan or reflect.
- **Linked reflections** — save notes generally, for a specific date, or alongside a goal.
- **Momentum Coach** — ask for a practical next step using live goal and progress context, with an automatic local fallback when AI is not configured.
- **Four persistent themes** — switch between Nebula, Solar Flare, Cyber Mint, and Quantum Rose on each device.
- **Built-in help center** — see every capability and the recommended plan → act → reflect loop without leaving the app.
- **Native Android wrapper and installable PWA** — use the same Northstar account and live data from an APK or an app-like browser installation.
- **Notification readiness** — grant device permission and send a test notification from Settings.
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

# Optional AI Momentum Coach (uses a local fallback when omitted)
OPENAI_API_KEY="your-server-side-openai-key"
OPENAI_MODEL="gpt-5.6-luna"

# Required only if calling the protected scheduler endpoint
CRON_SECRET="another-long-random-secret"
```

Never expose `OPENAI_API_KEY` through a `NEXT_PUBLIC_` environment variable. Add it only to the server environment, such as the Vercel project&apos;s environment variables.

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

## Android app

The `android/` project is a Capacitor wrapper around the production Northstar site. It uses the package ID `com.jigyasu.northstar`, blocks cleartext traffic, and shares the same authentication, database, themes, coach, and deployed updates as the web app.

To build an installable development APK, install JDK 21 and Android SDK Platform 36, set `sdk.dir` in `android/local.properties`, then run:

```bash
npm install
npm run android:build
```

The APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.

Public releases must use the same private signing key so Android can install future updates over earlier versions. Configure the release key outside the repository, then build with:

```bash
export NORTHSTAR_KEYSTORE_FILE="/secure/path/northstar-release.jks"
export NORTHSTAR_KEYSTORE_PASSWORD="your-keystore-password"
export NORTHSTAR_KEY_PASSWORD="your-key-password"
npm run android:build:release
```

The signed APK is created at `android/app/build/outputs/apk/release/app-release.apk`. Never commit signing keys or passwords. A Play Store release additionally requires an Android App Bundle (`.aab`).

## PWA and push notifications

Open the production site in Chrome on Android, sign in, then choose **Settings → Android and notifications → Install app**. If Chrome does not show the native prompt, use its menu and choose **Add to Home screen**.

The included service worker, manifest, notification permission flow, test signal, and push event handler prepare the PWA for Android use. Reliable scheduled notifications while the PWA or native app is closed still need a push delivery backend. The recommended next step is either:

- Firebase Cloud Messaging, using a Firebase project and web-app configuration; or
- standards-based Web Push, using VAPID public/private keys and a database table for device subscriptions.

## License

This project is available under the MIT License.
