# 🚀 PRODUCTION DEPLOYMENT CHECKLIST
**Campus Market P2P - Final Deployment Steps**

---

## ✅ CRITICAL TASKS (Must complete before launch)

### 1. Apply Database Migrations (30 minutes)

**Location:** All migrations in `supabase/migrations/`

**Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Apply migrations IN ORDER:

```sql
-- Migration 1: Add admin columns (if not already applied)
-- File: 20251229120647_add_admin_columns.sql

-- Migration 2: Add phone verified
-- File: 20260129_add_phone_verified.sql

-- Migration 3: Complete schema
-- File: 20260129_complete_schema.sql

-- Migration 4: Notifications
-- File: 20260129_notifications.sql

-- Migration 5: User devices
-- File: 20260130_user_devices.sql

-- Migration 6: Comprehensive schema
-- File: 20260131_comprehensive_schema.sql

-- Migration 7: Content moderation
-- File: 20260131_content_moderation.sql

-- Migration 8: Database constraints
-- File: 20260131_database_constraints.sql

-- Migration 9: Database constraints + RLS (CRITICAL FOR SECURITY)
-- File: 20260131_database_constraints_rls.sql

-- Migration 10: Escrow system
-- File: 20260131_escrow_system.sql

-- Migration 11: Fix user insert policy
-- File: 20260131_fix_user_insert_policy.sql

-- Migration 12: OTP and security (CRITICAL)
-- File: 20260131_otp_and_security.sql

-- Migration 13: Seller ratings
-- File: 20260131_seller_ratings.sql
```

**How to Apply:**
1. Open each `.sql` file
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Verify success message
6. Move to next migration

**Verification:**
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Should show: users, listings, transactions, messages, otp_sessions, 
-- trusted_devices, audit_logs, seller_ratings, reports

-- Check constraints exist
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'listings'::regclass;

-- Should show: check_price_positive, check_price_max, 
-- check_title_length, check_description_length, etc.
```

**⚠️ WARNING:** Do NOT skip the RLS migration. Without it, your API keys provide full database access.

---

### 2. Configure Environment Variables (5 minutes)

**Platform:** Vercel Dashboard

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: `campus-market-v1`
3. Navigate to **Settings → Environment Variables**
4. Add/verify these variables:

#### Required Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Resend Email (CRITICAL - OTP won't work without this)
RESEND_API_KEY=re_7iGG9zDx_9oMdJB1u5dPRk17PeJztpsGs
RESEND_FROM_EMAIL=noreply@campusmarketp2p.com.ng

# Sentry Error Monitoring
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your-org-name
SENTRY_PROJECT=campus-market-v1

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# App Configuration
NEXT_PUBLIC_APP_URL=https://campusmarketp2p.com.ng
NODE_ENV=production

# Security
ENCRYPTION_KEY=generate_32_char_random_string_here
JWT_SECRET=generate_64_char_random_string_here
```

#### Generate Secure Keys:

**Option 1: PowerShell (Windows)**
```powershell
# Generate ENCRYPTION_KEY (32 bytes)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate JWT_SECRET (64 bytes)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Option 2: Node.js**
```javascript
// Run in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Online**
- Visit: https://generate-random.org/api-token-generator
- Generate 32-character for ENCRYPTION_KEY
- Generate 64-character for JWT_SECRET

**After adding:**
1. Click **Save**
2. Go to **Deployments** tab
3. Click **Redeploy** on latest deployment
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy**

---

## ⚡ HIGH PRIORITY TASKS (Complete within 1 week)

### 3. Verify Production Environment

**Test Checklist:**

```bash
# 1. Health Check
curl https://campusmarketp2p.com.ng/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-31T...",
  "database": "connected",
  "environment": "production"
}

# 2. Phone Validation Test
# Visit: https://campusmarketp2p.com.ng/register
# Try signing up with: 08012345678
# Should: Accept without "Unsupported number" error

# 3. OTP Email Test
# Complete signup
# Check email for OTP code
# Should: Receive formatted email with 6-digit code

# 4. Rate Limiting Test
# Try creating 6 listings rapidly
# Should: Block after 5 with "Too many requests" error

# 5. Security Headers Test
curl -I https://campusmarketp2p.com.ng

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000
```

---

### 4. Sentry Configuration

**Setup Steps:**

1. **Create Sentry Account** (if not done)
   - Visit: https://sentry.io/signup
   - Create organization
   - Create project: "campus-market-v1"

2. **Get DSN:**
   - Go to **Settings → Projects → campus-market-v1**
   - Copy **DSN** (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

3. **Configure Vercel:**
   - Add `SENTRY_DSN` environment variable
   - Add `SENTRY_ORG` (your org name)
   - Add `SENTRY_PROJECT` (campus-market-v1)

4. **Verify:**
   - Visit your app
   - Trigger an error (visit `/test-error` route)
   - Check Sentry dashboard for captured error

---

### 5. Upstash Redis Setup

**Why:** Better rate limiting than in-memory storage (survives deployments)

**Setup Steps:**

1. **Create Account:**
   - Visit: https://upstash.com
   - Sign up/login

2. **Create Database:**
   - Click **Create Database**
   - Name: `campus-market-ratelimit`
   - Type: **Global** (for best performance)
   - Region: **Choose closest to your users**
   - Click **Create**

3. **Get Credentials:**
   - Click on your database
   - Copy **UPSTASH_REDIS_REST_URL**
   - Copy **UPSTASH_REDIS_REST_TOKEN**

4. **Add to Vercel:**
   - Settings → Environment Variables
   - Add both variables
   - Redeploy

5. **Update Code:**
   - Rate limiter already configured to use Redis
   - Will automatically switch from in-memory to Redis when env vars present

---

## 🔧 MEDIUM PRIORITY TASKS (Complete within 2-4 weeks)

### 6. End-to-End Escrow Testing

**Test Script:** `tests/escrow-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Escrow Flow', () => {
  test('Complete transaction lifecycle', async ({ page }) => {
    // 1. Buyer creates listing
    // 2. Seller initiates transaction
    // 3. Funds deposited to escrow
    // 4. Hash verified
    // 5. Seller delivers
    // 6. Buyer confirms
    // 7. Funds released
    // 8. Transaction marked complete
    // 9. Audit log created
  });
});
```

**Manual Testing:**
1. Create 2 test accounts (buyer + seller)
2. Seller lists item (₦1000)
3. Buyer initiates transaction
4. Check `transactions` table for:
   - `status = 'escrow'`
   - `hash` field populated
   - `escrow_amount = 1000`
5. Seller marks delivered
6. Buyer confirms receipt
7. Check `transactions` table for:
   - `status = 'completed'`
   - `released_at` timestamp
8. Check `audit_logs` for:
   - `deposit` action
   - `release` action
   - Both with correct transaction_id

---

### 7. XSS Sanitization Improvements

**Current State:** Basic sanitization in place

**Enhancement Plan:**

1. **Install DOMPurify:**
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

2. **Create Sanitizer:**
```typescript
// src/lib/sanitizer.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>\"'`]/g, '')
    .trim()
    .substring(0, 10000);
}
```

3. **Apply to All User Input:**
   - Listing titles/descriptions
   - Message content
   - User profiles
   - Review text

---

### 8. File Upload Virus Scanning

**Option 1: VirusTotal API (Free tier: 4 requests/min)**

```typescript
// src/lib/virus-scan.ts
export async function scanFile(fileUrl: string): Promise<boolean> {
  const response = await fetch('https://www.virustotal.com/api/v3/urls', {
    method: 'POST',
    headers: {
      'x-apikey': process.env.VIRUSTOTAL_API_KEY,
    },
    body: JSON.stringify({ url: fileUrl }),
  });
  
  const data = await response.json();
  return data.data.attributes.stats.malicious === 0;
}
```

**Option 2: ClamAV (Self-hosted, free)**

**Option 3: AWS S3 + Lambda (Scan on upload)**

**Recommended:** Start with VirusTotal for simplicity

---

### 9. Backup Automation

**Supabase Built-in Backups:**
- Daily automatic backups (last 7 days)
- Available in **Database → Backups**

**Additional Point-in-Time Recovery:**

1. **Enable PITR:**
   - Supabase Dashboard → Database → Backups
   - Click **Enable Point-in-Time Recovery**
   - Cost: ~$100/month (Pro plan required)

2. **Manual Backup Script:**
```bash
# scripts/backup-db.sh
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

3. **Cron Job:** Run daily at 2 AM
```bash
0 2 * * * /path/to/backup-db.sh
```

---

### 10. Performance Optimization

**Quick Wins:**

1. **Database Indexes** (Already added in migrations)
   - ✅ `idx_listings_seller` on seller_id
   - ✅ `idx_transactions_buyer` on buyer_id
   - ✅ `idx_messages_conversation` on conversation_id
   - ✅ `idx_audit_logs_created` on created_at

2. **Image Optimization:**
   - Use Next.js `<Image>` component (auto-optimization)
   - Implement lazy loading
   - Use WebP format

3. **Query Optimization:**
```typescript
// Before: N+1 query
const listings = await supabase.from('listings').select('*');
for (const listing of listings) {
  const seller = await supabase.from('users').select('*').eq('id', listing.seller_id);
}

// After: Single join query
const listings = await supabase
  .from('listings')
  .select('*, seller:users(*)');
```

4. **Caching Strategy:**
```typescript
// Cache popular listings for 5 minutes
const cachedListings = await redis.get('popular_listings');
if (cachedListings) return JSON.parse(cachedListings);

const listings = await getPopularListings();
await redis.setex('popular_listings', 300, JSON.stringify(listings));
```

5. **CDN Configuration:**
   - Vercel automatically provides CDN
   - Configure cache headers:
```typescript
export const config = {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
};
```

---

## 📊 DEPLOYMENT TIMELINE

### Today (Jan 31, 2026):
- ✅ Apply database migrations (30 min)
- ✅ Configure Resend API key (5 min)
- ✅ Test phone validation (10 min)
- ✅ Test OTP flow (10 min)

### This Week:
- ⏳ Set up Sentry (30 min)
- ⏳ Set up Upstash Redis (30 min)
- ⏳ Run end-to-end tests (2 hours)
- ⏳ Monitor error rates (daily)

### Next 2 Weeks:
- ⏳ Complete escrow testing (4 hours)
- ⏳ Implement DOMPurify (2 hours)
- ⏳ Set up VirusTotal scanning (3 hours)
- ⏳ Configure automated backups (2 hours)

### Next 4 Weeks:
- ⏳ Performance optimization (8 hours)
- ⏳ Load testing (4 hours)
- ⏳ Security penetration testing (8 hours)
- ⏳ Documentation updates (4 hours)

---

## ✅ SUCCESS CRITERIA

**System is production-ready when:**

- [x] All migrations applied
- [x] RLS policies active
- [x] Environment variables configured
- [ ] Health check returns 200
- [ ] Phone validation accepts Nigerian numbers
- [ ] OTP emails delivered successfully
- [ ] Rate limiting blocks excessive requests
- [ ] Error monitoring captures exceptions
- [ ] Escrow flow completes successfully
- [ ] No critical vulnerabilities found

**Estimated time to full production readiness:** 4-6 hours for critical tasks, then 2-4 weeks for polish.

---

## 🆘 TROUBLESHOOTING

### Issue: Migrations fail

**Solution:**
1. Check if migration already applied:
```sql
SELECT * FROM schema_migrations;
```
2. If partial failure, rollback:
```sql
BEGIN;
-- Run migration
-- If error, run:
ROLLBACK;
```

### Issue: RLS blocks legitimate requests

**Solution:**
1. Check user authentication:
```sql
SELECT auth.uid(); -- Should return user ID
```
2. Verify policy conditions match your auth setup

### Issue: OTP emails not sending

**Solution:**
1. Check Resend API key is valid
2. Check `RESEND_FROM_EMAIL` is verified in Resend dashboard
3. Check Vercel logs: `vercel logs --follow`

### Issue: Rate limiting too aggressive

**Solution:**
1. Adjust limits in `src/lib/rateLimiter.ts`
2. Redeploy
3. Clear Redis cache if using Upstash

---

## 📞 SUPPORT RESOURCES

- **Supabase Docs:** https://supabase.com/docs
- **Resend Docs:** https://resend.com/docs
- **Sentry Docs:** https://docs.sentry.io
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Support:** https://vercel.com/support

---

*Last Updated: January 31, 2026*  
*Status: Ready for critical deployment steps*
