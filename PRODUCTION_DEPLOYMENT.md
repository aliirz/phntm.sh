# 🚀 Production Deployment Guide

## ✅ Pre-Deployment Status

- ✅ **Frontend Build**: Compiles successfully
- ✅ **Tests**: All 83 tests passing  
- ✅ **Relay Server**: Dependencies ready
- ✅ **Environment Configs**: Templates created

---

## 🏗️ **STEP 1: Deploy Relay Infrastructure (Railway)**

### Create Railway Project
1. Go to https://railway.app
2. Sign up/Login with GitHub  
3. New Project → Deploy from GitHub repo
4. Select your repository → `relay-node` folder

### Environment Variables for Railway
```bash
SUPABASE_URL=https://cgektqiymfsjgornecqe.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key
SIGNALING_PORT=8080
STATUS_PORT=8081
FILE_TTL=86400000
MAX_DOWNLOADS=100
MAX_FILE_SIZE=1073741824
NODE_ENV=production
```

### Test Deployment
- Health check: `https://your-relay.railway.app/status`
- Save the Railway URL for frontend config

**Cost**: ~$20-40/month

---

## 🌐 **STEP 2: Deploy Frontend (Vercel)**

### Create Vercel Project
1. Go to https://vercel.com
2. Import GitHub repository
3. Select `p2p-share` folder
4. Auto-deploy on push to main

### Environment Variables for Vercel
```bash
NEXT_PUBLIC_SUPABASE_URL=https://cgektqiymfsjgornecqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_RELAY_SIGNALING_URL=wss://your-relay.railway.app:8080
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Cost**: Free tier

---

## 🔧 **STEP 3: Configure Services**

### Stripe Webhooks
- Endpoint: `https://your-app.vercel.app/api/stripe/webhook`
- Events: `customer.subscription.*`

### Supabase Settings  
- Add Vercel domain to allowed origins
- Verify RLS policies active

---

## 🧪 **STEP 4: Test Production**

### Test All User Flows
- ✅ Anonymous: 25MB uploads
- ✅ Free: Registration + 100MB uploads
- ✅ Pro: Payment + 1GB uploads + relay storage

### Health Monitoring
- Relay: `https://your-relay.railway.app/status`
- Frontend: `https://your-app.vercel.app`

---

## 💰 **Monthly Costs**
- Railway: $20-40
- Vercel: $0 (free)
- Supabase: $25
- **Total: ~$50-70**

---

## 🎯 **Next Steps After Deployment**

1. **Private testing** (3-5 days)
2. **UX polish** while deployed
3. **Public launch** with marketing

**Ready to deploy your production P2P file sharing app! 🚀** 