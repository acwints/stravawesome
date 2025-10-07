# StravAwesome Setup Guide

## 1. Set up Supabase Database

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `stravawesome`
   - Database Password: (choose a strong password and save it!)
   - Region: Choose closest to you
4. Click "Create new project"

### Get Database Connection String
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to "Connection string" section
3. Copy the **URI** connection string
4. Replace `[YOUR-PASSWORD]` with your database password
5. Replace `[YOUR-PROJECT-REF]` with your project reference

Example:
```
postgresql://postgres:yourpassword@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### Get Supabase API Keys
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (for `SUPABASE_SERVICE_ROLE_KEY`)

## 2. Set up Google OAuth

### Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret

## 3. Set up Strava API

### Create Strava Application
1. Go to [Strava Developers](https://developers.strava.com)
2. Click "Create & Manage Your App"
3. Fill in the form:
   - Application Name: `StravAwesome`
   - Category: `Training`
   - Club: (optional)
   - Website: `http://localhost:3000`
   - Authorization Callback Domain: `localhost`
4. Copy the Client ID and Client Secret

## 4. Set up OpenAI API

### Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click "Create new secret key"
5. Copy the API key

## 5. Update Environment Variables

1. Copy `.env.local` to `.env.local` in your project root
2. Replace all placeholder values with your actual credentials:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"

# Strava API
STRAVA_CLIENT_ID="your-actual-strava-client-id"
STRAVA_CLIENT_SECRET="your-actual-strava-client-secret"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-actual-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key"

# Database
DATABASE_URL="postgresql://postgres:yourpassword@db.your-project-ref.supabase.co:5432/postgres"
POSTGRES_URL="postgresql://postgres:yourpassword@db.your-project-ref.supabase.co:5432/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:yourpassword@db.your-project-ref.supabase.co:5432/postgres"

# OpenAI
OPENAI_API_KEY="your-actual-openai-api-key"
```

## 6. Generate NextAuth Secret

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## 7. Run Database Migrations

After setting up your environment variables:

```bash
npm install
npx prisma generate
npx prisma db push
```

## 8. Start the Development Server

```bash
npm run dev
```

Your app should now be running at http://localhost:3000!

## Troubleshooting

### Common Issues:
1. **Database connection errors**: Double-check your DATABASE_URL format
2. **OAuth errors**: Ensure redirect URIs match exactly
3. **Prisma errors**: Run `npx prisma generate` after schema changes
4. **Environment variables not loading**: Make sure you're using `.env.local` not `.env`

### Getting Help:
- Check the browser console for errors
- Check the terminal for server errors
- Verify all environment variables are set correctly