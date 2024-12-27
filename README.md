# StravAwesome

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

## Deployment

### Prerequisites

1. Create accounts on:
   - [Vercel](https://vercel.com) for hosting
   - [Supabase](https://supabase.com) or any PostgreSQL provider for the database
   - [Strava API](https://developers.strava.com) for authentication
   - [Stripe](https://stripe.com) for payments (if using premium features)

2. Set up your Strava API application:
   - Go to [Strava API Settings](https://www.strava.com/settings/api)
   - Create a new application
   - Note down the Client ID and Client Secret

### Deployment Steps

1. Push your code to GitHub

2. Connect your repository to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Build Command: `npx prisma generate && next build`
     - Install Command: `npm install`
     - Output Directory: `.next`

3. Set up environment variables in Vercel:
   ```
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-secret-key
   STRAVA_CLIENT_ID=your-strava-client-id
   STRAVA_CLIENT_SECRET=your-strava-client-secret
   POSTGRES_URL=your-postgres-connection-string
   POSTGRES_PRISMA_URL=your-postgres-connection-string
   POSTGRES_URL_NON_POOLING=your-postgres-connection-string
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

4. Set up the database:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push the schema to your database
   npx prisma db push
   ```

5. Configure OAuth Redirect URIs:
   - Go to your Strava API settings
   - Add the following redirect URIs:
     ```
     https://your-domain.com/api/auth/callback/strava
     https://your-domain.com/api/auth/signin/strava
     ```

6. Deploy:
   - Commit and push your changes to GitHub
   - Vercel will automatically deploy your application
   - Your app will be available at `https://your-domain.com`

### Post-Deployment

1. Test the authentication flow:
   - Visit your deployed site
   - Try logging in with Strava
   - Verify that the OAuth flow works correctly

2. Monitor your application:
   - Check Vercel analytics for performance metrics
   - Monitor database usage in Supabase/your database provider
   - Set up error tracking (e.g., Sentry) if needed

3. Set up custom domain (optional):
   - Go to Vercel project settings
   - Add your custom domain
   - Configure DNS settings as instructed

## License

MIT
