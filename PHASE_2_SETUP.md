# Phase 2 Setup Guide

## 🔧 Environment Variables Setup

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=https://cgektqiymfsjgornecqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZWt0cWl5bWZzamdvcm5lY3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzM2MTIsImV4cCI6MjA2NTMwOTYxMn0.yxjo0zHndMkXXXabx-xZBQx6eqzkyrthDSZOzWbHh_M

# Supabase Service Role (get from Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration (get from Stripe Dashboard)
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Product IDs (create these in Stripe Dashboard)
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 💳 Stripe Setup Steps

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Create a Product**: "P2P Share Pro" - $5/month
3. **Copy the Price ID** to `STRIPE_PRO_PRICE_ID`
4. **Get API Keys** from Developers > API Keys
5. **Set up Webhook** pointing to `https://yourapp.com/api/stripe/webhook`

## 🔐 Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Settings > API
3. Copy the `service_role` key (not the `anon` key)
4. Add it to `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Next Steps

After setting up environment variables:
1. Run `npm run dev`
2. Test authentication at `/auth`
3. Test subscription flow at `/pricing`
4. Verify webhook handling at `/api/stripe/webhook` 