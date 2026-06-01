# StravAwesome

A Next.js application that integrates with Strava API for tracking and analyzing athletic activities.

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- NextAuth.js for authentication
- Prisma/Postgres for database access
- Strava API integration

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The following environment variables are required:

- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`: Strava API credentials
- `DATABASE_URL`: Postgres connection string for Prisma
- `OPENAI_API_KEY`: Required for the AI chat feature
- `POLAR_*`: Required for paid subscription flows

Optional:

- `STRAVA_API_BASE_URL`: Defaults to `https://www.strava.com/api/v3`; set to `https://www.api-v3.strava.com` before Strava's June 1, 2027 cutoff.

## Features

- Google Authentication
- Strava Integration
- Activity Tracking
- Data Analysis
