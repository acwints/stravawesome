# Supabase Production Database Setup

## Quick Steps to Get Your Supabase Credentials:

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Sign in to your account

### 2. Select Your Project
- If you don't have a project, create one:
  - Click "New Project"
  - Choose your organization
  - Name: `stravawesome`
  - Set a strong database password
  - Choose your region

### 3. Get Database Connection String
- Go to **Settings** → **Database**
- Scroll down to "Connection string" section
- Copy the **URI** connection string
- It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 4. Get API Keys
- Go to **Settings** → **API**
- Copy these values:
  - **Project URL**: `https://[PROJECT-REF].supabase.co`
  - **anon public** key: `eyJ...` (long string)
  - **service_role** key: `eyJ...` (long string)

### 5. Update Your .env.local
Replace the empty values in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Database URL
DATABASE_URL="postgresql://postgres:yourpassword@db.your-project-ref.supabase.co:5432/postgres"
POSTGRES_URL="postgresql://postgres:yourpassword@db.your-project-ref.supabase.co:5432/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:yourpassword@db.your-project-ref.supabase.co:5432/postgres"
```

### 6. Test the Connection
After updating your `.env.local`:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

## Need Help?
If you can't find your Supabase project or need to create a new one, let me know and I can guide you through the process step by step.