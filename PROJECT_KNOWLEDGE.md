📜 CampusMarket P2P: Sovereign Technical Manifesto

> **DO NOT DELETE OR MODIFY WITHOUT AUTHORIZATION.**
> This document defines the "Soul" of the application. All future code must adhere to these directives.

## 1. Project Vision & Psychological Architecture
**CampusMarket P2P** is a high-velocity, decentralized commerce platform designed specifically for Nigerian university ecosystems.

* **The Psychological Hook:** It mimics the familiar UI/UX of WhatsApp (Teal `#008069`, Dark Mode `#111B21`) to lower the barrier to entry.
* **The Power Dynamic:** Commerce is decentralized (Direct-to-Seller WhatsApp links), but "Social Proof" and "Discovery" are centralized through a **Sovereign Stories Rail** controlled by the Admin.
* **Monetization/Growth Engine:** Contact farming occurs via "Verification Requests" and "Story Submissions," positioning the Admin as the ultimate campus authority.

## 2. Core Infrastructure & Security Keys
The system is built on **Next.js 15 (App Router)**, **Tailwind CSS**, and **Supabase (BaaS)**.

### 🔑 Critical Configuration
* **Supabase URL:** `https://vimovhpweucvperwhyzi.supabase.co`
* **Supabase Anon Key:** *Resolved via `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`*
* **Admin Identification (Sovereign Role):** The system identifies the "Supreme Admin" by checking the hardcoded `user_id` or metadata in the authentication flow and page.tsx.

## 3. Database Schema (Supabase/PostgreSQL)
The database is structured to handle high-concurrency "Story" views and product swiping.

### `videos` Table (The Stories Rail)
* `id`: UUID (Primary Key)
* `user_id`: UUID/Text (Owner)
* `video_url`: URL (MP4 hosted on Supabase/External)
* `thumbnail_url`: URL (Preview image)
* `caption`: Text
* `campus`: Text (OAU, UNILAG, UNIBEN, etc.)
* `is_admin`: Boolean (**Triggers the Gold Pulse UI**)
* `expires_at`: Timestamp (Managed by Cron for 24h deletion)

### `products` Table (The Marketplace)
* `id`: UUID
* `title`: Text
* `price`: BigInt
* `description`: Text
* `images`: JSONB/Text (Array of image URLs)
* `is_verified`: Boolean (**Triggers Green Pulse UI**)
* `seller_phone`: Text (Format: `234...` for WA link)
* `item_type`: Text (Electronics, Fashion, etc.)

## 4. Frontend Component Logic & Verifications

### A. The Singleton Client (`src/lib/supabase/client.ts`)
To prevent connection exhaustion, the app uses a Singleton Pattern for the Supabase instance.

### B. Stories Rail Implementation
* **Location:** Market page (`src/app/(marketplace)/market/page.tsx`)
* **Realtime Sync:** Uses `supabase.channel` to listen for `INSERT` and `DELETE` events on the `videos` table (when implemented).
* **UI Physics:** Uses `snap-x-mandatory` for mobile horizontal swiping.
* **Admin Logic:** Stories where `is_admin === true` receive a `border-[#FFD700]` (Gold) and a unique pulse animation to distinguish "Supreme" content.

### C. Product Card Implementation
* **Location:** Market page listing cards in `src/app/(marketplace)/market/page.tsx`
* **Multi-Image Carousel:** Fixed via `flex overflow-x-auto snap-x`. Images are parsed from JSON strings or arrays dynamically using `useMemo`.
* **Chat-to-Buy:** Direct `wa.me` links. The logic constructs the link using `encodeURIComponent` to include the product name in the seller's initial message.
* **Verification Pulse:** If `item.is_verified` is true, a CSS keyframe animation `ring-pulse` creates a green breathing effect.

## 5. Global Styling & Animations (`src/app/globals.css`)
* **Variables:** Defines `--wa-teal` (#008069) and `--wa-chat-bg` (#111B21).
* **Glassmorphism:** `.glass-3d` provides the premium overlay feel for Modals.
* **Ticker Engine:** A custom `@keyframes ticker` allows for an infinite marquee of Admin broadcasts.

## 6. Open Graph Dynamic Visuals (`src/app/opengraph-image.tsx`)
* **Visual Logic:** A radial gradient background (#075E54 to #008069) with a white shopping cart containing the WhatsApp logo.
* **Breathing Effect:** Accomplished via nested divs with varying opacity.

## 7. Operational Workflow (Sovereign Execution)
* **Deployment:** `git push origin main --force` (Vercel triggers build).
* **Seeding:** Done via SQL Editor.
* **Growth Strategy:** Admin posts high-value "Stories." Users click, see the deal, and funnel to Marketplace.
* **Admin Supremacy:** Admin has the power to DEL (Expunge) or VERIFY (Grant Pulse).

---
*End of Protocol.*

## Directory Structure (Current)
```
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── moderation/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── verify/page.tsx
│   │   ├── (marketplace)/
│   │   │   ├── market/page.tsx
│   │   │   ├── post/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── search/page.tsx
│   │   ├── (messaging)/
│   │   │   ├── chats/page.tsx
│   │   │   └── communities/page.tsx
│   │   ├── api/
│   │   ├── studio/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── opengraph-image.tsx
│   │   ├── page.tsx
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/ (Button, Input, Dialog, Badge)
│   │   └── shared/
│   └── lib/
│       ├── hooks/ (useAuth, useListings)
│       ├── supabase/ (client, server, proxy, utils)
│       ├── types/ (Comprehensive TypeScript definitions)
│       ├── utils.ts
│       └── jwt.ts
└── supabase/migrations/
```