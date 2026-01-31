# 🚀 ENVIRONMENT SETUP CHECKLIST
# Complete this step-by-step to configure your Campus Market P2P instance
# Estimated Time: 30-45 minutes

## PHASE 1: CREATE ACCOUNTS (20 minutes)

### ✅ Step 1: Supabase (Database & Auth)
- [ ] Go to https://supabase.com
- [ ] Click "Start your project"
- [ ] Create new organization
- [ ] Create new project
  - Name: campus-market-prod
  - Database Password: (generate strong password - save in password manager)
  - Region: Choose closest to Nigeria (e.g., eu-west-1 or eu-central-1)
- [ ] Wait 2-3 minutes for project creation
- [ ] **Get credentials:**
  - Go to Settings → API
  - Copy "Project URL" → Paste into NEXT_PUBLIC_SUPABASE_URL
  - Copy "anon public" key → Paste into NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  - Copy "service_role" key → Paste into SUPABASE_SERVICE_ROLE_KEY

### ✅ Step 2: SendGrid (Email)
- [ ] Go to https://sendgrid.com
- [ ] Sign up for free account (100 emails/day free)
- [ ] Verify your email
- [ ] Go to Settings → API Keys
- [ ] Click "Create API Key"
  - Name: campus-market-production
  - Permissions: Full Access
- [ ] **Copy API key** → Paste into SENDGRID_API_KEY
- [ ] Go to Settings → Sender Authentication
- [ ] Verify a sender email (e.g., noreply@yourdomain.com)
- [ ] Copy verified email → Paste into SENDGRID_FROM_EMAIL

**Alternative: Resend (Simpler)**
- [ ] Go to https://resend.com
- [ ] Sign up → Get API key
- [ ] Use RESEND_API_KEY instead

### ✅ Step 3: Twilio (SMS/OTP)
- [ ] Go to https://twilio.com/try-twilio
- [ ] Sign up for trial account ($15 credit)
- [ ] Verify your phone number
- [ ] Go to Console → Account → Keys & Credentials
- [ ] **Copy Account SID** → Paste into TWILIO_ACCOUNT_SID
- [ ] **Copy Auth Token** → Paste into TWILIO_AUTH_TOKEN
- [ ] Go to Phone Numbers → Get a phone number
- [ ] **Copy phone number** (with +country code) → Paste into TWILIO_PHONE_NUMBER

**Nigerian Alternative: Termii**
- If Twilio doesn't work in Nigeria, use Termii.com

### ✅ Step 4: Upstash (Redis for Rate Limiting)
- [ ] Go to https://console.upstash.com
- [ ] Sign up (free tier: 10K commands/day)
- [ ] Click "Create Database"
  - Name: campus-market-redis
  - Type: Regional
  - Region: Choose closest (e.g., eu-west-1)
- [ ] Click on database → REST API tab
- [ ] **Copy UPSTASH_REDIS_REST_URL** → Paste into .env.local
- [ ] **Copy UPSTASH_REDIS_REST_TOKEN** → Paste into .env.local

### ✅ Step 5: Paystack (Payments - Nigerian Focus)
- [ ] Go to https://paystack.com
- [ ] Sign up → Complete KYC
- [ ] Go to Settings → API Keys & Webhooks
- [ ] Start with TEST keys:
  - Copy "Test Public Key" → NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
  - Copy "Test Secret Key" → PAYSTACK_SECRET_KEY
- [ ] Later switch to LIVE keys when ready

**Alternative: Flutterwave (Pan-Africa)**
- [ ] Use if Paystack not available in your country

### ✅ Step 6: Sentry (Error Monitoring - Optional but Recommended)
- [ ] Go to https://sentry.io
- [ ] Sign up for free account
- [ ] Create new project → Choose Next.js
- [ ] **Copy DSN** → Paste into NEXT_PUBLIC_SENTRY_DSN

---

## PHASE 2: CONFIGURE ENVIRONMENT (10 minutes)

### ✅ Step 7: Generate Security Tokens
```powershell
# Run this in PowerShell:
cd c:\Users\Dell\Documents\campusmarketp2p\campus-market-v1
.\generate-tokens.ps1
```
- [ ] Copy JWT_SECRET to .env.local
- [ ] Copy ENCRYPTION_KEY to .env.local
- [ ] Save both tokens in password manager

### ✅ Step 8: Fill Remaining Values
- [ ] NEXT_PUBLIC_APP_URL=http://localhost:3000 (for now)
- [ ] NODE_ENV=development
- [ ] ADMIN_EMAIL=your-email@domain.com

---

## PHASE 3: DATABASE SETUP (15 minutes)

### ✅ Step 9: Install Supabase CLI
```powershell
# Install via npm:
npm install -g supabase

# Or via Scoop (Windows):
scoop install supabase
```

### ✅ Step 10: Link Project
```powershell
cd c:\Users\Dell\Documents\campusmarketp2p\campus-market-v1
supabase link --project-ref YOUR_PROJECT_REF
```
- Your project ref is in the Supabase URL: https://YOUR_PROJECT_REF.supabase.co

### ✅ Step 11: Run Database Migrations
```powershell
# Push all migrations to Supabase
supabase db push

# Verify schema
supabase db diff
```

### ✅ Step 12: Create Admin User
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Run this query:

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@campusmarket.com',  -- Change this to your email
  crypt('your-secure-password', gen_salt('bf')),
  now(),
  now(),
  now()
) RETURNING id;

-- Copy the returned UUID, then:

INSERT INTO public.users (
  id,  -- Use the UUID from above
  email,
  full_name,
  is_admin,
  is_verified,
  created_at
) VALUES (
  'UUID-FROM-ABOVE',
  'admin@campusmarket.com',
  'Admin User',
  true,
  true,
  now()
);
```

---

## PHASE 4: VERIFY SETUP (15 minutes)

### ✅ Step 13: Test Build
```powershell
cd c:\Users\Dell\Documents\campusmarketp2p\campus-market-v1
npm run build
```
- [ ] Build completes without errors
- [ ] No "Missing environment variable" errors

### ✅ Step 14: Test Development Server
```powershell
npm run dev
```
- [ ] Server starts on http://localhost:3000
- [ ] Home page loads without errors
- [ ] Open browser console → No errors

### ✅ Step 15: Test Critical Flows

**Test Authentication:**
- [ ] Go to /register
- [ ] Enter phone number
- [ ] Verify OTP is sent (check Twilio logs)
- [ ] Complete registration

**Test Database Connection:**
- [ ] Check browser console for errors
- [ ] Go to /market
- [ ] Listings should load (even if empty)

**Test Admin Access:**
- [ ] Login with admin credentials
- [ ] Go to /dashboard
- [ ] Should see admin panel

### ✅ Step 16: Check Monitoring
- [ ] Go to Sentry → Projects → Campus Market
- [ ] Trigger a test error: `throw new Error("Test Sentry")`
- [ ] Verify error appears in Sentry dashboard

---

## PHASE 5: SECURITY VERIFICATION (10 minutes)

### ✅ Step 17: Verify .gitignore
```powershell
# Make sure .env.local is NOT tracked:
git status
# Should NOT show .env.local
```

### ✅ Step 18: Test Rate Limiting
```powershell
# Test Redis connection:
npm run dev
# Make 5+ requests to /api/listings rapidly
# Should get rate limited after threshold
```

### ✅ Step 19: Check Supabase RLS Policies
- [ ] Go to Supabase → Authentication → Policies
- [ ] Verify RLS is enabled on all tables
- [ ] Test that non-admin can't access admin data

---

## ✅ SETUP COMPLETE!

### Next Steps:
1. Run full test suite (if you have tests)
2. Complete PRODUCTION_READINESS_CHECKLIST.md
3. Deploy to Vercel staging
4. Test with 5-10 beta users
5. Monitor Sentry for errors
6. Fix any issues before public launch

### Resources:
- **Troubleshooting:** See DEPLOYMENT_GUIDE.md
- **Security:** See CAMPUS_MARKET_SECURITY_AUDIT.md
- **Production Deploy:** See PRODUCTION_READINESS_CHECKLIST.md

---

## 🆘 NEED HELP?

**Common Issues:**

1. **"Cannot connect to Supabase"**
   - Check NEXT_PUBLIC_SUPABASE_URL is correct
   - Verify NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is the "anon" key
   - Check if Supabase project is paused (free tier sleeps after inactivity)

2. **"OTP not sending"**
   - Check Twilio Account SID and Auth Token
   - Verify phone number format includes country code (+234...)
   - Check Twilio balance (trial account has credit)

3. **"Rate limiting not working"**
   - Verify Upstash Redis URL and Token
   - Check if Redis database is active
   - Test connection in Upstash console

4. **"Build fails"**
   - Check all REQUIRED env vars are set
   - Run `npm run build` and read error message carefully
   - Verify TypeScript has no errors

**Still stuck?** Check the error logs in:
- Browser console (F12)
- Terminal output
- Sentry dashboard
- Supabase logs (Dashboard → Logs)
