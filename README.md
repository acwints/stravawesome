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

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use `.env.example` as a template (safe to commit)
- Keep all sensitive credentials in `.env.local` for development
- Store production credentials securely in your deployment platform

### Git Security
The repository is configured to ignore sensitive files:
```gitignore
.env
.env.*
!.env.example
```

If sensitive files are accidentally committed:
1. Remove them from git history using `git filter-branch`
2. Force push the changes
3. Rotate all exposed credentials immediately

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

### Automated Deployment

The project is configured for continuous deployment:

1. **GitHub Integration**:
   - Push changes to the main branch
   - Vercel automatically detects changes
   - Builds and deploys automatically

2. **Build Process**:
   ```bash
   # These run automatically on Vercel
   npx prisma generate
   next build
   ```

3. **Environment Variables**:
   Configure in Vercel dashboard:
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

4. **Strava OAuth Configuration**:
   - Go to your Strava API settings
   - Add the following redirect URIs:
     ```
     https://your-domain.com/api/auth/callback/strava
     https://your-domain.com/api/auth/signin/strava
     ```

### Post-Deployment Verification

1. **Monitor Deployment**:
   - Check Vercel dashboard for deployment status
   - Review build logs for any issues
   - Verify environment variables are set

2. **Test Authentication**:
   - Verify Strava OAuth flow
   - Test login/logout functionality
   - Check user session handling

3. **Database Verification**:
   - Confirm database connections
   - Test data retrieval and storage
   - Monitor query performance

4. **Error Monitoring**:
   - Check application logs
   - Monitor API responses
   - Track authentication flows

## License

MIT
