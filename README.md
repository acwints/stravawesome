# Stravawesome

A powerful dashboard for Strava athletes with custom analytics and goal-setting capabilities.

## Features

- 🏃‍♂️ Strava Integration: View your activities and stats
- 📊 Custom Analytics Dashboard: Visualize your training data
- 🎯 Goal Setting (Premium): Set and track your fitness goals
- 💳 Premium Features: Available through Stripe subscription

## Tech Stack

- Next.js
- TypeScript
- TailwindCSS
- Prisma (Database)
- Next-Auth (Authentication)
- Stripe (Payments)
- Recharts (Data Visualization)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Configure your environment variables:
   - STRAVA_CLIENT_ID
   - STRAVA_CLIENT_SECRET
   - NEXTAUTH_SECRET
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - DATABASE_URL

5. Run the development server:
   ```bash
   npm run dev
   ```

## Development

The application uses:
- App Router for routing
- Server Components for improved performance
- API Routes for backend functionality
- Prisma for database management
- TailwindCSS for styling

## License

MIT
