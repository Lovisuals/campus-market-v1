# Database Migration & Setup Guide

## Quick Setup (5 minutes)

### Step 1: Run Database Migration

1. **Go to Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/vimovhpweucvperwhydzi/sql
   ```

2. **Copy all content from `apply-migrations.sql`**

3. **Click "RUN" button**

4. **Wait for success message** (should see "Success. No rows returned")

### Step 2: Create Admin User

1. **Go to Supabase Authentication:**
   ```
   https://supabase.com/dashboard/project/vimovhpweucvperwhydzi/auth/users
   ```

2. **Click "Add user" → "Create new user"**

3. **Enter admin credentials:**
   - Email: `admin@campusmarketp2p.com.ng`
   - Password: `[Choose a strong password]`
   - Auto Confirm User: **✅ Check this box**

4. **Click "Create user"**

5. **Copy the user's UUID** (you'll see it in the users list)

### Step 3: Make User Admin

1. **Go back to SQL Editor**

2. **Open `create-admin.sql`**

3. **Replace `YOUR_USER_UUID_HERE`** with the UUID you copied

4. **Run the script**

5. **Verify**: You should see the admin user in the results

### Step 4: Test Local Development

```powershell
# Navigate to project
cd c:\Users\Dell\Documents\campusmarketp2p\campus-market-v1

# Start development server
npm run dev
```

Visit: http://localhost:3000

### Step 5: Test Admin Login

1. Go to: http://localhost:3000/login
2. Login with admin email and password
3. You should be redirected to: http://localhost:3000/dashboard
4. You should see admin panel

---

## Verification Checklist

- [ ] All migrations applied (no errors in SQL Editor)
- [ ] Admin user created in Authentication
- [ ] Admin user updated in users table (is_admin = true)
- [ ] Dev server runs without errors
- [ ] Can login successfully
- [ ] Can access admin dashboard
- [ ] Can see pending posts for approval (if any)

---

## Database Tables Created

**Core Tables:**
- ✅ users (with is_admin, is_verified, phone_verified)
- ✅ otp_sessions (email OTP verification)

**Marketplace Tables:**
- ✅ posts (with approval workflow)
- ✅ listings (legacy)
- ✅ approval_queue
- ✅ verification_requests

**Financial Tables:**
- ✅ transactions
- ✅ escrow_accounts
- ✅ disputes
- ✅ payouts

**Messaging Tables:**
- ✅ chats
- ✅ messages (with encryption support)

**System Tables:**
- ✅ notifications
- ✅ audit_log

---

## Next Steps After Setup

1. **Test User Signup Flow:**
   - Go to /register
   - Create test user account
   - Check email for OTP verification

2. **Test Post Creation:**
   - Login as regular user
   - Go to /post
   - Create a new listing
   - Verify it appears in admin approval queue

3. **Test Admin Approval:**
   - Login as admin
   - Go to /dashboard
   - Approve/reject pending posts

4. **Test Messaging:**
   - Go to /chats
   - Test messaging with platform owner
   - Test instant chat modal

5. **Verify Email OTP:**
   - Check Resend dashboard for sent emails
   - Verify OTP emails are delivered

---

## Troubleshooting

### Issue: "relation does not exist" error
**Solution:** Make sure all migrations ran successfully. Re-run apply-migrations.sql

### Issue: Can't access admin dashboard
**Solution:** Verify is_admin = true in users table:
```sql
SELECT id, email, is_admin FROM users WHERE email = 'admin@campusmarketp2p.com.ng';
```

### Issue: Email OTP not received
**Solution:** Check Resend dashboard → Logs. Verify RESEND_API_KEY in .env.local

### Issue: Redis connection error
**Solution:** Verify UPSTASH_REDIS_REST_URL and TOKEN in .env.local

### Issue: Supabase connection error
**Solution:** Verify all 3 Supabase keys in .env.local:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

---

## Environment Variables Status

✅ All configured in `.env.local`:

**Supabase (Database & Auth):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

**Resend (Email OTP):**
- RESEND_API_KEY
- RESEND_FROM_EMAIL

**Upstash (Rate Limiting):**
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

**Security:**
- JWT_SECRET
- ENCRYPTION_KEY

**App Config:**
- NEXT_PUBLIC_APP_URL
- NODE_ENV

---

## Production Deployment Checklist

When ready to deploy to production:

- [ ] Copy `.env.local` variables to Vercel environment
- [ ] Update NEXT_PUBLIC_APP_URL to production URL
- [ ] Set NODE_ENV=production
- [ ] Enable Supabase Row Level Security (already enabled)
- [ ] Test all authentication flows
- [ ] Test email delivery
- [ ] Set up Vercel deployment
- [ ] Update DNS to point to Vercel
- [ ] Enable SSL (automatic on Vercel)
- [ ] Monitor error logs

---

## Support

For issues, check:
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Comprehensive setup guide
- [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) - Deployment checklist
- [CAMPUS_MARKET_ARCHITECTURE.md](./CAMPUS_MARKET_ARCHITECTURE.md) - Technical architecture

---

**Last Updated:** January 31, 2025  
**Status:** Ready for local testing
