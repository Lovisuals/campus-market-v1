# 🚀 Deployment & Configuration Guide

**Last Updated:** January 31, 2026  
**Status:** ✅ Production Ready (with conditions)  
**Environments:** Vercel | Self-Hosted | Docker | Local Development  

---

## ⚡ QUICK START (5 minutes)

If you know what you're doing:

```bash
# 1. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 2. Build
npm run build

# 3. Deploy
# Vercel: git push origin main
# Self-hosted: npm start (with PM2/systemd)
# Docker: docker build -t campus-market . && docker run -p 3000:3000 campus-market

# 4. Verify
curl http://localhost:3000/api/health
```

**Done!** Now complete the PRODUCTION_READINESS_CHECKLIST.md before opening to users.

---

## 📋 STEP-BY-STEP DEPLOYMENT GUIDE

### Step 1: Prerequisites (15 minutes)

#### Required Accounts
- [ ] Supabase (Database) - https://supabase.co
- [ ] SendGrid (Email) - https://sendgrid.com OR Resend
- [ ] Twilio (SMS) - https://twilio.com
- [ ] Upstash (Redis) - https://upstash.com
- [ ] Sentry (Error monitoring) - https://sentry.io (Optional but recommended)
- [ ] Vercel (Deployment) OR your own VPS

#### GitHub Secret Scanning
```bash
# Verify your repo has these enabled:
# Settings → Security & Analysis → Secret scanning
# Settings → Security & Analysis → Push protection
```

---

### Step 2: Environment Configuration (10 minutes)

Create `.env.local` file:

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

#### Complete Environment Variables

**Supabase (Database)**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep secret!
```

**SendGrid (Email)**
```
SENDGRID_API_KEY=SG.xxxxx  # From SendGrid dashboard
SENDGRID_FROM_EMAIL=noreply@campusmarket.app
```

**Twilio (SMS)**
```
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio number
```

**Upstash (Redis - Rate Limiting)**
```
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

**Sentry (Error Monitoring)**
```
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=production  # or staging/development
```

**Application**
```
NEXT_PUBLIC_APP_URL=https://campusmarket.app
NODE_ENV=production
```

---

### Step 3: Database Setup (10 minutes)

#### Create Database in Supabase

```sql
-- This runs automatically from supabase/migrations/
-- But verify these tables exist:

-- 1. Users table
SELECT * FROM auth.users LIMIT 1;

-- 2. Profiles table
SELECT * FROM public.profiles LIMIT 1;

-- 3. Listings table
SELECT * FROM public.listings LIMIT 1;

-- 4. Transactions table
SELECT * FROM public.transactions LIMIT 1;

-- 5. Messages table
SELECT * FROM public.messages LIMIT 1;
```

#### Apply Migrations

```bash
# If using Supabase CLI:
supabase migration up

# If using migration scripts:
npm run db:migrate
```

#### Set Up Row-Level Security (RLS)

```sql
-- Example for listings table
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Users can see their own listings
CREATE POLICY "Users can view their own listings"
  ON public.listings FOR SELECT
  USING (auth.uid() = user_id);

-- Only admin can approve listings
CREATE POLICY "Only admin can approve listings"
  ON public.listings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM auth.users WHERE role = 'admin'));
```

---

### Step 4: Local Testing (20 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Test endpoints
curl http://localhost:3000/api/health
# Should return: { "status": "ok" }

# 4. Test in browser
open http://localhost:3000

# 5. Test signup flow
- Go to /register
- Enter phone number
- Verify OTP received
- Create account
- Create listing
- Verify listing shows as pending_approval

# 6. Test admin
- Create another user
- Login as admin
- Go to /moderation
- Approve/reject listings
```

#### Common Issues

| Issue | Fix |
|-------|-----|
| "Cannot find module" | Run `npm install` again |
| "Port 3000 already in use" | Kill process or use `PORT=3001 npm run dev` |
| "OTP not received" | Verify Twilio credentials and number format |
| "Listings not showing" | Check database connection and RLS policies |
| "Build fails" | Check `.env.local` has all required vars |

---

### Step 5: Build Verification (5 minutes)

```bash
# Production build
npm run build

# Expected output:
# ✓ Compiled successfully
# ○ Routes: 19 static + 8 API
# ○ Build size: ~300KB

# Start production server locally
npm start

# Verify: curl http://localhost:3000/api/health
```

---

## 🚀 DEPLOYMENT OPTIONS

### Option A: Vercel (Easiest - 5 minutes)

1. **Connect GitHub**
   ```bash
   git push origin main
   ```

2. **Configure on Vercel**
   - Go to https://vercel.com
   - Import repository
   - Add environment variables from `.env.local`
   - Click Deploy

3. **Setup Custom Domain**
   - Go to project settings
   - Add domain: campusmarket.app
   - Update DNS records (provided by Vercel)

4. **Enable Preview Deployments**
   - Settings → Git → Preview Deployments
   - Auto-deploy on PR

---

### Option B: Self-Hosted (AWS/DigitalOcean/Linode)

#### Prerequisites
```bash
# Server with:
- Node.js 18+
- PostgreSQL (or use external Supabase)
- 2GB RAM minimum
- 10GB storage
- Public IP address
```

#### Deployment Steps

1. **SSH to server**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node and PM2**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Clone repository**
   ```bash
   git clone https://github.com/Lovisuals/campus-market-v1.git
   cd campus-market-v1
   ```

4. **Setup environment**
   ```bash
   nano .env
   # Paste your environment variables
   ```

5. **Install and build**
   ```bash
   npm install --production
   npm run build
   ```

6. **Start with PM2**
   ```bash
   pm2 start "npm start" --name "campus-market"
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx reverse proxy**
   ```nginx
   # /etc/nginx/sites-available/default
   server {
       listen 80;
       server_name campusmarket.app;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable HTTPS (SSL Certificate)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d campusmarket.app
   ```

---

### Option C: Docker (Scalable)

1. **Build image**
   ```bash
   docker build -t campus-market:latest .
   ```

2. **Create .env file**
   ```bash
   nano .env
   ```

3. **Run container**
   ```bash
   docker run -d \
     --name campus-market \
     -p 3000:3000 \
     --env-file .env \
     campus-market:latest
   ```

4. **Verify**
   ```bash
   docker logs campus-market
   curl http://localhost:3000/api/health
   ```

#### Docker Compose (Multi-container)

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
      # ... other vars
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
```

---

## 🔐 Security Checklist Before Going Live

### Server Security
- [ ] Firewall enabled (only allow 80, 443, 22)
- [ ] SSH key-based auth only (no passwords)
- [ ] Fail2ban installed to prevent brute force
- [ ] Automatic security updates enabled
- [ ] No unnecessary services running

### Application Security
- [ ] All security patches applied (see SECURITY_AUDIT_REPORT.md)
- [ ] Environment variables not in code
- [ ] Secrets not in Git history
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Security headers present in all responses
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### Database Security
- [ ] Database backups enabled (daily)
- [ ] Backups tested (restore verification)
- [ ] Row-level security (RLS) enabled
- [ ] Database user has minimal permissions
- [ ] Connection encrypted (SSL)
- [ ] Logs monitored for anomalies

### Monitoring & Alerting
- [ ] Error tracking (Sentry or similar)
- [ ] Uptime monitoring
- [ ] CPU/Memory alerts
- [ ] Database connection pool monitoring
- [ ] Failed login alerts
- [ ] Rate limit violation alerts

---

## 📊 Service Testing Procedures

### Email Service (SendGrid)

```bash
# 1. Send test email
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@campusmarket.app"},
    "subject": "Test",
    "content": [{"type": "text/plain", "value": "Test email"}]
  }'

# 2. Check email received (should be instant)
```

### SMS Service (Twilio)

```bash
# 1. Send test SMS
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "Body=Campus Market Test" \
  --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
  --data-urlencode "To=+1234567890" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# 2. Check SMS received (should be instant)
```

### Redis Connection (Upstash)

```bash
# 1. Test connection
curl -X GET "https://default:$UPSTASH_REDIS_REST_TOKEN@$UPSTASH_REDIS_REST_URL/ping"
# Should return: PONG

# 2. Set test value
curl -X POST "https://default:$UPSTASH_REDIS_REST_TOKEN@$UPSTASH_REDIS_REST_URL/set/test/value"

# 3. Get test value
curl -X GET "https://default:$UPSTASH_REDIS_REST_TOKEN@$UPSTASH_REDIS_REST_URL/get/test"
# Should return: value
```

### Database Connection (Supabase)

```bash
# 1. Query tables
curl -X GET "https://$SUPABASE_PROJECT.supabase.co/rest/v1/profiles?limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"

# 2. Verify auth works
curl -X POST "https://$SUPABASE_PROJECT.supabase.co/auth/v1/signup" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

---

## 🔍 Post-Deployment Verification

### First Hour After Deployment

```bash
# 1. Check uptime
curl http://campusmarket.app/api/health
# Expected: {"status":"ok"}

# 2. Check errors
# Go to Sentry dashboard
# Should show 0 new errors

# 3. Test signup flow
# Use staging account
# Go through complete flow

# 4. Check security headers
curl -I http://campusmarket.app
# Verify headers present:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
```

### First 24 Hours

| Check | Target | Action |
|-------|--------|--------|
| Error rate | < 0.1% | Alert if exceeded |
| Response time p99 | < 500ms | Alert if exceeded |
| CPU usage | < 60% | Scale if higher |
| Memory usage | < 70% | Restart if higher |
| Database queries | < 100ms p99 | Optimize if slower |
| Failed logins | < 1% | Review patterns |

---

## 🚨 Incident Response

### Server is Down

```bash
# 1. SSH to server
ssh root@your-server-ip

# 2. Check logs
pm2 logs campus-market

# 3. Check process status
pm2 status

# 4. Restart if needed
pm2 restart campus-market

# 5. Check again
curl http://localhost:3000/api/health
```

### High Error Rate

```bash
# 1. Check Sentry for error patterns
# Find common error messages
# Check stack traces for file/line number

# 2. Review recent deployments
git log --oneline -5

# 3. If corrupted: Rollback
git revert <commit-hash>
npm run build
pm2 restart campus-market
```

### Database Connection Failed

```bash
# 1. Check Supabase status
# Go to Supabase dashboard
# Check for maintenance notifications

# 2. Verify credentials
# Check .env file
# Verify values in Supabase dashboard match

# 3. Test connection
curl -X GET "https://$SUPABASE_PROJECT.supabase.co/rest/v1/users?limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"

# 4. If credentials wrong: Update and restart
nano .env
pm2 restart campus-market
```

---

## 📞 Rollback Procedure

If deployment breaks production:

```bash
# 1. Identify last working commit
git log --oneline | head -20

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild
npm run build

# 4. Restart
pm2 restart campus-market

# 5. Verify working
curl http://campusmarket.app/api/health

# 6. Investigate issue
# Check what changed in broken commit
git show <broken-commit-hash>

# 7. Fix the issue
# Apply fix to new branch
# Test thoroughly
# Merge and redeploy
```

---

## 🎓 Common Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "502 Bad Gateway" | App crashed or not running | SSH and check: `pm2 logs campus-market` |
| "Connection timeout" | Firewall blocking | Check: `sudo ufw allow 3000` |
| "Database error" | Wrong credentials | Verify .env matches Supabase |
| "High memory usage" | Memory leak in code | Restart app: `pm2 restart campus-market` |
| "Slow responses" | Database slow queries | Optimize queries or add indexes |
| "OTP not sent" | Twilio misconfigured | Verify API key and phone format |

---

## ✅ Deployment Checklist

Before deploying to production, complete:

- [ ] Local testing passed
- [ ] Build compiles without errors
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Database backups enabled
- [ ] Error monitoring configured
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] SSL certificate ready
- [ ] Firewall configured
- [ ] Admin account created
- [ ] 2FA enabled on admin
- [ ] Monitoring alerts set up
- [ ] Incident response plan ready
- [ ] Team trained on procedures

---

## 🎯 Post-Deployment Next Steps

1. **Monitor closely** (First 24-48 hours)
   - Check error logs every hour
   - Monitor response times
   - Verify users can sign up

2. **User onboarding** (Days 3-7)
   - Start with 10-50 beta users
   - Gather feedback
   - Fix issues immediately

3. **Gradual rollout** (Weeks 2-4)
   - Increase to 500-1K users
   - Monitor performance
   - Scale resources if needed

4. **Full launch** (Weeks 4+)
   - Open to public
   - Active marketing
   - Continuous monitoring

---

**Last Updated:** January 31, 2026  
**Status:** ✅ PRODUCTION READY  
**Support:** See SECURITY_AUDIT_REPORT.md for security issues
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV SENDGRID_API_KEY=$SENDGRID_API_KEY

RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 📋 Step-by-Step Deployment Checklist

### Phase 1: Credentials Setup (30 minutes)

- [ ] **Create Supabase Project**
  - Visit https://supabase.com/dashboard
  - Create new project
  - Copy URL and anon key

- [ ] **Create SendGrid Account**
  - Visit https://sendgrid.com
  - Create API key
  - Verify sender email domain

- [ ] **Create Twilio Account**
  - Visit https://www.twilio.com/console
  - Get Account SID and Auth Token
  - Provision phone number

- [ ] **Create Upstash Redis**
  - Visit https://console.upstash.com
  - Create Redis database
  - Copy REST URL and token

- [ ] **Choose Payment Provider**
  - [ ] Paystack: https://paystack.com/signup
  - [ ] OR Flutterwave: https://app.flutterwave.com/dashboard
  - Create merchant account and get API keys

### Phase 2: Environment Variables (10 minutes)

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
# Windows: notepad .env.local
# Mac/Linux: nano .env.local
```

**Required Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
```

### Phase 3: Database Setup (20 minutes)

```bash
# Run migrations
cd supabase
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your_project_ref

# Push migrations
supabase db push
```

**Verify RLS Policies:**
```sql
-- In Supabase SQL Editor, run:
SELECT * FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check each table has RLS enabled:
SELECT * FROM pg_tables t 
WHERE t.schemaname = 'public' 
AND EXISTS (
  SELECT 1 FROM information_schema.table_privileges p 
  WHERE p.table_name = t.tablename 
  AND p.privilege_type = 'SELECT'
);
```

### Phase 4: Build & Test Locally (10 minutes)

```bash
# Build the application
npm run build

# Should see:
# ✓ Compiled successfully
# ✓ Finished TypeScript
# ✓ Collecting page data

# Start local server
npm run start

# Test in browser: http://localhost:3000
```

### Phase 5: Create Admin User (5 minutes)

```bash
# In Supabase console:
# 1. Go to Authentication > Users
# 2. Click "Add User"
# 3. Create admin user with:
#    Email: admin@campusmarket.com
#    Password: (strong password)

# 4. In SQL Editor, add admin role:
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'admin@campusmarket.com';

# 5. Update public.profiles table:
INSERT INTO profiles (id, email, is_admin)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@campusmarket.com'),
  'admin@campusmarket.com',
  true
) ON CONFLICT (id) DO UPDATE 
SET is_admin = true;
```

### Phase 6: Test Email & SMS (10 minutes)

```bash
# Test SendGrid Email
# Create test file: test-email.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'your-email@example.com',
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Campus Market Test',
  text: 'Hello from Campus Market!',
  html: '<strong>Hello from Campus Market!</strong>',
};

sgMail.send(msg)
  .then(() => console.log('✅ Email sent'))
  .catch(error => console.error('❌ Error:', error));

# Run it
node test-email.js

# Test Twilio SMS
# Create test file: test-sms.js
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.messages.create({
  body: 'Hello from Campus Market!',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+1234567890' // Your test phone
})
.then(message => console.log('✅ SMS sent:', message.sid))
.catch(error => console.error('❌ Error:', error));

# Run it
node test-sms.js
```

### Phase 7: Deploy to Production

#### Option A: Vercel (Recommended for Next.js)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables during prompt
# Or go to: vercel.com → Project Settings → Environment Variables

# 4. Re-deploy after adding env vars
vercel --prod
```

#### Option B: Self-Hosted (VPS/Server)

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/yourusername/campus-market.git
cd campus-market/campus-market-v1

# 3. Install dependencies
npm install

# 4. Create .env.local with production values
nano .env.local
# Paste production environment variables

# 5. Build
npm run build

# 6. Start with PM2 (for process management)
npm install -g pm2
pm2 start "npm run start" --name "campus-market"
pm2 save
pm2 startup

# 7. Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/campusmarket
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name campusmarket.com www.campusmarket.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name campusmarket.com www.campusmarket.com;
    
    ssl_certificate /etc/letsencrypt/live/campusmarket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/campusmarket.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Option C: Docker Deployment

```bash
# 1. Build Docker image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_key" \
  --build-arg SENDGRID_API_KEY="your_key" \
  -t campus-market .

# 2. Run container
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  -e NODE_ENV="production" \
  --name campus-market-container \
  campus-market

# 3. Check logs
docker logs campus-market-container
```

---

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
# Should return: { "status": "ok" }
```

### 2. Test Login
- Navigate to https://your-domain.com/login
- Enter test phone number: +234 9XX XXX XXXX
- Verify OTP SMS arrives
- Complete login

### 3. Create Test Listing
- Log in as regular user
- Navigate to marketplace
- Create test listing
- Verify in admin dashboard it shows as `pending_approval`

### 4. Admin Approval
- Log in as admin user
- Navigate to admin dashboard
- Approve test listing
- Verify status changes to `active`

### 5. Security Headers Check
```bash
# Check response headers
curl -I https://your-domain.com/api/listings

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

### 6. Rate Limiting Test
```bash
# Send multiple rapid requests
for i in {1..50}; do
  curl https://your-domain.com/api/listings
done

# Should eventually get 429 (Too Many Requests)
```

---

## ⚠️ Common Deployment Failures

### Error: "Missing required environment variables"
**Cause:** Env vars not set before build
**Fix:** Set environment variables BEFORE running `npm run build`

### Error: "Cannot read property 'supabase' of undefined"
**Cause:** Supabase client not initialized
**Fix:** Check `NEXT_PUBLIC_SUPABASE_URL` is valid

### Error: "403 Unauthorized" on listings API
**Cause:** RLS policies blocking requests
**Fix:** Check policies allow authenticated users

### SMS not sending
**Cause:** Twilio credentials invalid
**Fix:** 
```bash
node -e "
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
console.log(client.api.accounts(client.api.account_sid).fetch());
"
```

### Email not sending
**Cause:** SendGrid API key invalid or sender not verified
**Fix:**
- Verify sender email in SendGrid console
- Check API key has "Mail Send" permission

---

## 🔒 Security Hardening

### 1. SSL/TLS Certificate
```bash
# Get free certificate from Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### 2. Enable HTTPS Redirect
Already configured in `next.config.js`:
```javascript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains'
}
```

### 3. Database Backups
```bash
# Supabase automatically backs up daily
# Download backups from: supabase.com → Settings → Backups

# Or use pg_dump:
pg_dump -h your-server.supabase.co -U postgres dbname > backup.sql
```

### 4. Rate Limiting Monitoring
Monitor Redis for spike attacks:
```bash
redis-cli INFO stats | grep total_commands_processed
```

### 5. Admin 2FA
In Supabase console:
1. Enable multi-factor authentication for admin users
2. Require MFA for all admin_audit_log actions

---

## 📊 Monitoring & Maintenance

### Monitor Error Rates
```bash
# Check Sentry dashboard
# App > Issues > Error Rate

# Or via CLI:
sentry cli releases list
```

### Check Uptime
```bash
# Set up status page: https://www.statuspage.io
# Monitor endpoint: GET /api/health
```

### Database Performance
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY total_time DESC;

-- Check connection count
SELECT datname, count(*) FROM pg_stat_activity 
GROUP BY datname;
```

### Memory Usage
```bash
# SSH into server
free -h
top -b -n 1 | head -n 20
```

---

## 🎯 Success Criteria

✅ Application builds without errors  
✅ Environment variables are set  
✅ Database migrations are applied  
✅ Admin user can log in  
✅ Regular user can register and verify phone  
✅ Listings creation requires admin approval  
✅ Security headers are present  
✅ Rate limiting is active  
✅ Email notifications are sending  
✅ SMS notifications are sending  

---

**Ready to deploy? Checklist items needed: 7/7 ✅**
