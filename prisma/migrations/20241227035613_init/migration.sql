-- Create a function to get the current user ID from the JWT
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.sub', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "stravaId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StravaProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "athleteId" TEXT NOT NULL,

    CONSTRAINT "StravaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "movingTime" INTEGER NOT NULL,
    "totalTime" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,
    "polyline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "timeframe" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stravaId_key" ON "User"("stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "StravaProfile_userId_key" ON "StravaProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StravaProfile_athleteId_key" ON "StravaProfile"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StravaProfile" ADD CONSTRAINT "StravaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS on all tables
ALTER TABLE "public"."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."StravaProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Subscription" ENABLE ROW LEVEL SECURITY;

-- Create policies for Account table
CREATE POLICY "Users can view their own accounts" ON "public"."Account"
    FOR SELECT USING ("userId" = get_current_user_id());
CREATE POLICY "Users can update their own accounts" ON "public"."Account"
    FOR UPDATE USING ("userId" = get_current_user_id());
CREATE POLICY "Users can delete their own accounts" ON "public"."Account"
    FOR DELETE USING ("userId" = get_current_user_id());

-- Create policies for Session table
CREATE POLICY "Users can view their own sessions" ON "public"."Session"
    FOR SELECT USING ("userId" = get_current_user_id());
CREATE POLICY "Users can update their own sessions" ON "public"."Session"
    FOR UPDATE USING ("userId" = get_current_user_id());
CREATE POLICY "Users can delete their own sessions" ON "public"."Session"
    FOR DELETE USING ("userId" = get_current_user_id());

-- Create policies for User table
CREATE POLICY "Users can view their own profile" ON "public"."User"
    FOR SELECT USING (id = get_current_user_id());
CREATE POLICY "Users can update their own profile" ON "public"."User"
    FOR UPDATE USING (id = get_current_user_id());

-- Create policies for StravaProfile table
CREATE POLICY "Users can view their own Strava profile" ON "public"."StravaProfile"
    FOR SELECT USING ("userId" = get_current_user_id());
CREATE POLICY "Users can update their own Strava profile" ON "public"."StravaProfile"
    FOR UPDATE USING ("userId" = get_current_user_id());
CREATE POLICY "Users can delete their own Strava profile" ON "public"."StravaProfile"
    FOR DELETE USING ("userId" = get_current_user_id());

-- Create policies for Activity table
CREATE POLICY "Users can view their own activities" ON "public"."Activity"
    FOR SELECT USING ("userId" = get_current_user_id());
CREATE POLICY "Users can update their own activities" ON "public"."Activity"
    FOR UPDATE USING ("userId" = get_current_user_id());
CREATE POLICY "Users can delete their own activities" ON "public"."Activity"
    FOR DELETE USING ("userId" = get_current_user_id());

-- Create policies for Goal table
CREATE POLICY "Users can view their own goals" ON "public"."Goal"
    FOR SELECT USING ("userId" = get_current_user_id());
CREATE POLICY "Users can update their own goals" ON "public"."Goal"
    FOR UPDATE USING ("userId" = get_current_user_id());
CREATE POLICY "Users can delete their own goals" ON "public"."Goal"
    FOR DELETE USING ("userId" = get_current_user_id());

-- Create policies for Subscription table
CREATE POLICY "Users can view their own subscription" ON "public"."Subscription"
    FOR SELECT USING ("userId" = get_current_user_id());
CREATE POLICY "Users can update their own subscription" ON "public"."Subscription"
    FOR UPDATE USING ("userId" = get_current_user_id());
CREATE POLICY "Users can delete their own subscription" ON "public"."Subscription"
    FOR DELETE USING ("userId" = get_current_user_id());

-- Allow insert for all authenticated users (needed for registration/auth flows)
CREATE POLICY "Allow insert for authenticated users" ON "public"."User"
    FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);
CREATE POLICY "Allow insert for authenticated users" ON "public"."Account"
    FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);
CREATE POLICY "Allow insert for authenticated users" ON "public"."Session"
    FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);
CREATE POLICY "Allow insert for authenticated users" ON "public"."StravaProfile"
    FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);
CREATE POLICY "Allow insert for authenticated users" ON "public"."Activity"
    FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);
CREATE POLICY "Allow insert for authenticated users" ON "public"."Goal"
    FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);
CREATE POLICY "Allow insert for authenticated users" ON "public"."Subscription"
    FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);
