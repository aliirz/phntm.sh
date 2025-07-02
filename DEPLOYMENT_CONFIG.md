# Frontend Deployment Configuration

## Environment Variables for Vercel

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cgektqiymfsjgornecqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Relay Server (update after Railway deployment)
NEXT_PUBLIC_RELAY_SIGNALING_URL=wss://your-relay.railway.app:8080

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Deployment Steps

### 1. Deploy to Vercel
```bash
npm run build
# Deploy to Vercel via GitHub integration
```

### 2. Configure Webhooks
- Stripe webhook URL: `https://your-app.vercel.app/api/stripe/webhook`
- Test webhook delivery

### 3. Update Relay URLs
- Get Railway deployment URL
- Update NEXT_PUBLIC_RELAY_SIGNALING_URL
- Redeploy frontend 