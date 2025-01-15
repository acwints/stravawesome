# StravAwesome

A Next.js application that integrates with Strava API for tracking and analyzing athletic activities.

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- NextAuth.js for authentication
- Supabase for database
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
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase configuration
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Features

- Google Authentication
- Strava Integration
- Activity Tracking
- Data Analysis
