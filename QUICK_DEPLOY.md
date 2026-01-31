# 🚀 Quick Start Deployment
**Deploy Critical Fixes in 5 Minutes**

## Step 1: Database (2 minutes)
```bash
# Apply migrations
npx supabase db push

# OR manually in Supabase SQL Editor:
# Execute: supabase/migrations/20260131_otp_and_security.sql
# Execute: supabase/migrations/20260131_database_constraints_rls.sql
```

## Step 2: Environment Variables (1 minute)
Go to Vercel Dashboard → Settings → Environment Variables

**CRITICAL - Generate NEW Supabase Key:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=NEW_KEY_HERE  # Must regenerate!
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Step 3: Deploy (2 minutes)
```bash
npm run build  # Test build locally
git add .
git commit -m "fix: critical security and UX fixes"
git push origin main
```

## Step 4: Verify
```bash
# Check health
curl https://campusmarketp2p.com.ng/api/health

# Test signup
# Visit: https://campusmarketp2p.com.ng/register
# Enter: 08012345678 (should work ✓)
```

## ✅ Success Checklist
- [ ] Health check returns "healthy"
- [ ] Phone validation accepts Nigerian numbers
- [ ] Loading spinners show on forms
- [ ] No console errors

## 🆘 Issues?
See [CRITICAL_FIXES_IMPLEMENTATION.md](CRITICAL_FIXES_IMPLEMENTATION.md) for details.

**Done! Monitor for 24 hours. 🎉**
