# Polar.sh Integration Guide

This document outlines the premium subscription implementation using Polar.sh.

## Implementation Overview

### What's Been Implemented

1. **Database Schema** (`prisma/schema.prisma`)
   - Added `Subscription` model with fields for Polar subscription tracking
   - Linked to User model via 1-to-1 relationship

2. **Subscription Utilities** (`src/lib/subscription.ts`)
   - `checkPremiumStatus()` - Check if user has active subscription
   - `PREMIUM_FEATURES` - List of features requiring premium
   - `FREE_FEATURES` - List of always-free features (Activity Heatmap)
   - `PRICING` - Pricing configuration ($12/year)

3. **API Routes**
   - `/api/subscription/status` - Get current user's subscription status

4. **Client Hooks** (`src/hooks/useSubscription.ts`)
   - `useSubscription()` - React hook for checking premium status on client

5. **UI Components**
   - `PremiumGate` - Wrapper component that shows paywall for non-premium users
   - `/pricing` page - Full pricing page with feature comparison
   - Updated Navbar with "Upgrade to Premium" link

6. **Premium Gates Applied**
   - ✅ AI Training Coach (Premium)
   - ✅ Goal Tracking (Premium)
   - ✅ Weekly Activity Chart (Premium)
   - ✅ Activity List (Premium)
   - ✅ Photo Gallery (Premium)
   - ✅ Training Map (Premium)
   - 🆓 Activity Heatmap (FREE forever)

## Next Steps (TODO)

### 1. Set Up Polar.sh Account
1. Create account at https://polar.sh
2. Create a product:
   - Name: "StravAwesome Premium"
   - Price: $12 USD
   - Billing: Annual
3. Get API credentials:
   - Access Token
   - Organization ID
   - Product ID

### 2. Add Environment Variables
Add to `.env.local`:
```env
POLAR_ACCESS_TOKEN=your_access_token
POLAR_ORGANIZATION_ID=your_org_id
POLAR_PRODUCT_ID=your_product_id
```

### 3. Implement Polar Checkout
Update `src/app/pricing/page.tsx`:
```typescript
import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

const handleUpgrade = async () => {
  // Create checkout session
  const checkout = await polar.checkouts.custom.create({
    productPriceId: process.env.POLAR_PRODUCT_ID!,
    customerId: session.user.email,
    successUrl: `${window.location.origin}/dashboard?success=true`,
    customerEmail: session.user.email,
  });

  // Redirect to checkout
  window.location.href = checkout.url;
};
```

### 4. Set Up Webhooks
Create webhook handler at `src/app/api/webhooks/polar/route.ts`:

```typescript
import { Polar } from '@polar-sh/sdk';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const payload = await request.json();

  switch (payload.type) {
    case 'subscription.created':
    case 'subscription.updated':
      // Update user subscription in database
      await prisma.subscription.upsert({
        where: { userId: payload.data.customer_id },
        create: {
          userId: payload.data.customer_id,
          polarSubscriptionId: payload.data.id,
          status: payload.data.status,
          plan: 'annual',
          currentPeriodEnd: new Date(payload.data.current_period_end),
        },
        update: {
          status: payload.data.status,
          currentPeriodEnd: new Date(payload.data.current_period_end),
        },
      });
      break;

    case 'subscription.canceled':
      await prisma.subscription.update({
        where: { polarSubscriptionId: payload.data.id },
        data: { status: 'canceled' },
      });
      break;
  }

  return new Response('OK');
}
```

Configure webhook URL in Polar dashboard:
- URL: `https://stravawesome.com/api/webhooks/polar`
- Events: `subscription.*`

### 5. Testing
1. Use Polar test mode for development
2. Create test subscription
3. Verify premium features unlock
4. Test webhook handling
5. Test subscription expiration

## Current Architecture

```
User Authentication (NextAuth)
    ↓
Dashboard Load
    ↓
useSubscription() hook
    ↓
GET /api/subscription/status
    ↓
checkPremiumStatus(userId)
    ↓
Query Subscription table
    ↓
Return { isPremium, subscription }
    ↓
PremiumGate components
    ↓
Show content OR paywall
```

## Free vs Premium

### Always Free
- Activity Calendar (GitHub-style heatmap)
- Basic Strava connection

### Premium ($12/year)
- AI Training Coach
- Goal Setting & Tracking
- Weekly Activity Charts
- Interactive Route Maps
- Photo Gallery
- Full Activity History

## Notes

- All premium gates implemented with loading state handling
- Premium status cached for 1 minute client-side
- Database subscription status checked server-side
- Subscription expiration checked on every request
- Clean UI with blur effect on gated content
