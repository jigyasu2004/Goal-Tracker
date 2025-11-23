# 🎯 Goal Tracker

A modern, full-stack goal tracking application built with Next.js, Prisma, and PostgreSQL. Track your daily, short-term, and long-term goals with a beautiful, responsive interface.

**🚀 Live Demo:** [https://goal-tracker-cyan.vercel.app/](https://goal-tracker-cyan.vercel.app/)

## ✨ Features

- **📅 Interactive Calendar**: Visual history of your goal completion with daily status indicators.
- **📝 Smart Notes**: Context-aware note-taking linked to specific dates or goals.
- **🔄 Recurring Goals**: Set goals that repeat on specific days (e.g., "Gym on Mon/Wed/Fri").
- **📱 Fully Responsive**: Seamless experience on desktop, tablet, and mobile devices.
- **🔐 Secure Authentication**: User accounts protected with NextAuth.js.
- **🎨 Modern UI**: Beautiful gradient design with dark/light mode elements.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Supabase)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/jigyasu2004/Goal-Tracker.git
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env` file with:
    ```env
    DATABASE_URL="your_postgres_connection_string"
    NEXTAUTH_SECRET="your_secret_key"
    NEXTAUTH_URL="http://localhost:3000"
    ```

4.  **Run Database Migrations**:
    ```bash
    npx prisma db push
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
