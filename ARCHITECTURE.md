# StravAwesome Architecture Documentation

## Overview

StravAwesome is a Next.js 15 application that integrates with Strava to provide training analytics and AI-powered insights.

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Leaflet** - Map visualization
- **SWR** - Data fetching and caching
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - Serverless API
- **NextAuth.js** - Authentication
- **Prisma** - ORM and database management
- **Supabase/PostgreSQL** - Database
- **OpenAI API** - AI chat functionality

### External APIs
- **Strava API** - Activity data
- **Google OAuth** - Authentication provider

## Directory Structure

```
src/
├── app/                      # Next.js 15 App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── strava/          # Strava integration
│   │   ├── goals/           # Goals management
│   │   └── ai/              # AI chat endpoints
│   ├── auth/                # Auth pages
│   ├── dashboard/           # Main dashboard
│   └── layout.tsx           # Root layout with error boundary
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   ├── ErrorBoundary.tsx   # Error handling
│   └── LoadingSpinner.tsx  # Loading states
├── lib/                     # Core utilities
│   ├── api-response.ts     # Standardized API responses
│   ├── logger.ts           # Centralized logging
│   ├── prisma.ts           # Database client
│   ├── rate-limit.ts       # Rate limiting
│   ├── strava-client.ts    # Strava API client
│   └── validation.ts       # Data validation
├── services/               # API client services
├── types/                  # TypeScript definitions
├── utils/                  # Helper functions
└── middleware.ts           # Request/response middleware
```

## Key Features

### 1. Authentication
- Multi-provider OAuth (Google, Strava)
- Session management with NextAuth.js
- Database-backed sessions using Prisma adapter

### 2. Strava Integration
- OAuth flow for connecting Strava accounts
- Automatic token refresh
- Activity data synchronization
- GPS data fetching for map visualization

### 3. Training Analytics
- Activity tracking and visualization
- Goal setting and progress tracking
- Weekly/monthly statistics
- Interactive maps with training routes

### 4. AI Coach
- OpenAI-powered training insights
- Contextual analysis of training data
- Personalized recommendations

## Architecture Patterns

### 1. Error Handling
- Standardized API error responses
- Client-side error boundaries
- Comprehensive logging
- User-friendly error messages

### 2. Data Fetching
- SWR for client-side caching
- Server-side data fetching in API routes
- Optimistic updates for better UX

### 3. Security
- Rate limiting on all API endpoints
- Security headers via middleware
- Input validation and sanitization
- Environment variable validation

### 4. Logging
- Structured logging with context
- Different log levels (debug, info, warn, error)
- Performance monitoring (request duration)
- External API call tracking

### 5. Database
- Connection pooling for production
- Query optimization
- Prisma migrations
- Type-safe database operations

## API Structure

### Authentication Flow
```
1. User clicks "Sign in with Google/Strava"
2. Redirected to OAuth provider
3. Provider redirects back with code
4. NextAuth exchanges code for tokens
5. User and account records created in database
6. Session created and stored in database
```

### Strava Data Flow
```
1. User connects Strava account
2. OAuth tokens stored in database
3. API routes check for valid token
4. If expired, automatically refresh using refresh token
5. Fetch data from Strava API
6. Transform and return to client
```

### API Response Format
All API routes use standardized responses:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... } // Only in development
}
```

## Performance Optimizations

### 1. Caching
- SWR caching for API responses
- Static generation where possible
- CDN for static assets

### 2. Code Splitting
- Route-based code splitting
- Dynamic imports for heavy components
- Optimized bundle size

### 3. Database
- Connection pooling
- Indexed queries
- Minimal data fetching

### 4. API Calls
- Batched requests where possible
- Parallel data fetching
- Cached external API responses

## Security Considerations

### 1. Authentication
- Secure session management
- CSRF protection via NextAuth
- HTTPOnly cookies

### 2. API Protection
- Rate limiting per user/IP
- Input validation
- SQL injection prevention (Prisma)

### 3. Data Protection
- Environment variable security
- No sensitive data in client bundle
- Proper OAuth scopes

### 4. Headers
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- XSS protection
- Frame protection

## Monitoring & Logging

### Application Logs
- Request/response logging
- Error tracking
- Performance metrics
- External API call tracking

### Metrics to Monitor
- API response times
- Error rates
- Database query performance
- External API usage and limits
- User authentication success rate

## Deployment

### Environment Variables
See `.env.production.example` for required variables.

### Build Process
```bash
npm run build
```

### Database Migrations
```bash
npx prisma migrate deploy
```

### Vercel Deployment
The application is optimized for Vercel deployment with:
- Automatic SSL
- Edge functions
- Environment variable management
- Preview deployments

## Testing Strategy

### Types of Tests
1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - API routes and database
3. **E2E Tests** - Full user workflows
4. **Performance Tests** - Load testing API endpoints

### Critical Paths to Test
- OAuth authentication flow
- Strava connection and sync
- Goal creation and updates
- AI chat functionality
- Token refresh logic

## Troubleshooting

### Common Issues
1. **Token Refresh Failures** - Check Strava API credentials
2. **Database Connection** - Verify connection string and pooling
3. **OAuth Errors** - Check callback URLs and credentials
4. **Rate Limits** - Monitor external API usage

### Debug Mode
Set `NEXT_PUBLIC_ENABLE_DEBUG="true"` for verbose logging.

## Future Improvements

### Potential Features
- Real-time activity sync
- Social features (compare with friends)
- Training plan generation
- Advanced analytics and insights
- Mobile app

### Technical Improvements
- Add Redis for caching and rate limiting
- Implement background job processing
- Add comprehensive test coverage
- Set up proper monitoring (Sentry, DataDog)
- Implement GraphQL API option
