# Implementation Plan for Next Steps

## 1. Add phone_verified column and sync with auth events
- [x] Create migration: supabase/migrations/20260129_add_phone_verified.sql
- [ ] Run migration to add phone_verified column
- [ ] Update /api/listings/route.ts to check phone_verified instead of phone presence

## 2. Add server-side rate-limiting / abuse protections on POST /api/listings
- [x] Install rate-limiter-flexible package
- [ ] Create rate limiter setup in src/lib/rateLimiter.ts
- [ ] Update /api/listings/route.ts with rate-limiting and abuse checks

## 3. Implement email/SMS notifications for admin verification workflow
- [x] Install @sendgrid/mail and twilio packages
- [ ] Create notification service in src/lib/notifications.ts
- [ ] Update /api/listings/route.ts to trigger notifications on listing creation
- [ ] Create background job script for sending notifications

## 4. Add E2E tests for signup → post → admin approval
- [x] Install @playwright/test package
- [ ] Set up Playwright config
- [ ] Create E2E test file for signup → post → admin approval flow
- [ ] Run tests and fix issues

## Followup steps
- [ ] Test all changes manually
- [ ] Deploy and monitor in production
