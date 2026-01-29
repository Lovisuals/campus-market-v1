# CAMPUS MARKET P2P - PRODUCTION ARCHITECTURE v1.0

**Last Updated:** January 29, 2026  
**Target Platform:** Next.js 15+ | Supabase | Vercel  
**Status:** LIVE - Incremental Enhancement Mode

---

## 🎯 ARCHITECTURAL PHILOSOPHY

### Core Principles:
1. **WhatsApp-First UX** - Every interaction mirrors WhatsApp's simplicity and speed
2. **Zero Breaking Changes** - All upgrades are additive; no feature regressions
3. **Real-time by Default** - Leverage Supabase Realtime for instant updates
4. **Mobile-First** - 90% of users on mobile; optimize accordingly
5. **Modular Expansion** - Add features without touching core infrastructure
6. **Type-Safe Everything** - Full TypeScript coverage, no implicit `any`

---

## 📁 DIRECTORY STRUCTURE

```
campus-market-v1/
│
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── (auth)/                   # Auth routes group
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx          # Registration with phone verification
│   │   │   └── verify/
│   │   │       └── page.tsx          # OTP verification page
│   │   │
│   │   ├── (marketplace)/            # Main marketplace routes
│   │   │   ├── market/
│   │   │   │   ├── page.tsx          # Browse listings (with filters)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Individual listing detail
│   │   │   ├── post/
│   │   │   │   └── page.tsx          # Create new listing (modal-style)
│   │   │   ├── profile/
│   │   │   │   └── page.tsx          # User profile & stats
│   │   │   └── search/
│   │   │       └── page.tsx          # Advanced search
│   │   │
│   │   ├── (messaging)/              # Real-time chat system
│   │   │   ├── chats/
│   │   │   │   ├── page.tsx          # Chat list (WhatsApp-style)
│   │   │   │   └── [chatId]/
│   │   │   │       └── page.tsx      # Individual chat thread
│   │   │   └── communities/
│   │   │       ├── page.tsx          # Community/group list
│   │   │       └── [communityId]/
│   │   │           └── page.tsx      # Community chat view
│   │   │
│   │   ├── (admin)/                  # Admin dashboard (protected)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Analytics overview
│   │   │   ├── moderation/
│   │   │   │   └── page.tsx          # Pending approvals queue
│   │   │   ├── users/
│   │   │   │   └── page.tsx          # User management
│   │   │   └── reports/
│   │   │       └── page.tsx          # Flagged content review
│   │   │
│   │   ├── api/                      # API Routes (Server Actions preferred)
│   │   │   ├── listings/
│   │   │   │   ├── route.ts          # GET /api/listings (search/filter)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET/PUT/DELETE individual listing
│   │   │   ├── messages/
│   │   │   │   └── route.ts          # WebSocket fallback for chat
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # Image upload to Supabase Storage
│   │   │   ├── webhooks/
│   │   │   │   ├── whatsapp/
│   │   │   │   │   └── route.ts      # WhatsApp Business API webhook
│   │   │   │   └── payment/
│   │   │   │       └── route.ts      # Paystack/Flutterwave webhook
│   │   │   └── admin/
│   │   │       ├── approve/
│   │   │       │   └── route.ts      # Approve pending listings
│   │   │       └── analytics/
│   │   │           └── route.ts      # Fetch platform metrics
│   │   │
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles + Tailwind imports
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...                   # Other shadcn components
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── header.tsx            # Top navigation bar
│   │   │   ├── bottom-nav.tsx        # Mobile bottom nav (WhatsApp-style)
│   │   │   ├── sidebar.tsx           # Desktop sidebar (admin/desktop view)
│   │   │   └── footer.tsx
│   │   │
│   │   ├── listings/                 # Listing-specific components
│   │   │   ├── listing-card.tsx      # Individual listing preview
│   │   │   ├── listing-grid.tsx      # Grid of listings
│   │   │   ├── listing-form.tsx      # Create/edit listing form
│   │   │   ├── listing-filters.tsx   # Search filters sidebar
│   │   │   ├── quick-post-modal.tsx  # WhatsApp-style quick photo post
│   │   │   └── image-upload.tsx      # Drag-drop image uploader
│   │   │
│   │   ├── messaging/                # Chat components
│   │   │   ├── chat-list.tsx         # WhatsApp-style chat list
│   │   │   ├── chat-bubble.tsx       # Individual message bubble
│   │   │   ├── chat-input.tsx        # Message input with media attach
│   │   │   ├── voice-note.tsx        # Voice message recorder
│   │   │   ├── typing-indicator.tsx  # "User is typing..." indicator
│   │   │   └── message-status.tsx    # Sent/Delivered/Read indicators
│   │   │
│   │   ├── auth/                     # Authentication components
│   │   │   ├── phone-input.tsx       # International phone number input
│   │   │   ├── otp-input.tsx         # 6-digit OTP input
│   │   │   ├── campus-selector.tsx   # University dropdown selection
│   │   │   └── auth-guard.tsx        # Protected route wrapper
│   │   │
│   │   ├── admin/                    # Admin-only components
│   │   │   ├── approval-queue.tsx    # Pending listings queue
│   │   │   ├── user-table.tsx        # Sortable user list
│   │   │   ├── analytics-card.tsx    # Metric display card
│   │   │   └── moderation-tools.tsx  # Ban/warn/approve actions
│   │   │
│   │   └── shared/                   # Shared utilities
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── empty-state.tsx
│   │       └── confirmation-dialog.tsx
│   │
│   ├── lib/                          # Core business logic
│   │   ├── supabase/                 # Supabase client & utilities
│   │   │   ├── client.ts             # Browser client (cookies)
│   │   │   ├── server.ts             # Server client (for RSC)
│   │   │   ├── middleware.ts         # Auth middleware
│   │   │   └── storage.ts            # File upload helpers
│   │   │
│   │   ├── api/                      # API interaction layer
│   │   │   ├── listings.ts           # Listing CRUD operations
│   │   │   ├── messages.ts           # Chat operations
│   │   │   ├── users.ts              # User profile operations
│   │   │   ├── communities.ts        # Community/group operations
│   │   │   └── payments.ts           # Payment processing
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── use-auth.ts           # Auth state hook
│   │   │   ├── use-realtime.ts       # Supabase Realtime hook
│   │   │   ├── use-listings.ts       # Listing data fetching
│   │   │   ├── use-chat.ts           # Chat state management
│   │   │   ├── use-debounce.ts       # Input debouncing
│   │   │   └── use-infinite-scroll.ts # Pagination helper
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── validation.ts         # Zod schemas & validators
│   │   │   ├── formatting.ts         # Date, currency, phone formatters
│   │   │   ├── image-processing.ts   # Image compression & resizing
│   │   │   ├── whatsapp.ts           # WhatsApp API helpers
│   │   │   └── analytics.ts          # Event tracking helpers
│   │   │
│   │   ├── constants/                # App-wide constants
│   │   │   ├── universities.ts       # List of supported campuses
│   │   │   ├── categories.ts         # Listing categories
│   │   │   ├── config.ts             # App configuration
│   │   │   └── pricing.ts            # Premium tier pricing
│   │   │
│   │   └── types/                    # TypeScript type definitions
│   │       ├── database.ts           # Supabase auto-generated types
│   │       ├── listings.ts           # Listing-related types
│   │       ├── users.ts              # User profile types
│   │       ├── messages.ts           # Chat message types
│   │       └── api.ts                # API request/response types
│   │
│   └── middleware.ts                 # Next.js middleware (auth check)
│
├── supabase/
│   ├── migrations/                   # Database migrations
│   │   ├── 00001_initial_schema.sql  # Users, listings tables
│   │   ├── 00002_messaging.sql       # Chats, messages tables
│   │   ├── 00003_communities.sql     # Communities, memberships
│   │   ├── 00004_payments.sql        # Transactions, escrow
│   │   └── 00005_admin.sql           # Admin roles, moderation
│   │
│   ├── functions/                    # Edge Functions
│   │   ├── send-whatsapp/            # WhatsApp Business API sender
│   │   │   └── index.ts
│   │   ├── auto-moderate/            # AI content moderation
│   │   │   └── index.ts
│   │   └── analytics/                # Metric aggregation
│   │       └── index.ts
│   │
│   └── config.toml                   # Supabase local config
│
├── public/
│   ├── images/                       # Static images
│   │   ├── logo.svg
│   │   ├── placeholder.png
│   │   └── campus-icons/             # University logos
│   ├── fonts/                        # Custom fonts (if any)
│   └── manifest.json                 # PWA manifest
│
├── tests/                            # Test suites
│   ├── unit/                         # Unit tests (Vitest)
│   │   ├── utils/
│   │   ├── hooks/
│   │   └── components/
│   ├── integration/                  # API integration tests
│   │   └── api/
│   └── e2e/                          # End-to-end tests (Playwright)
│       └── user-flows/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Run tests on PR
│       ├── deploy.yml                # Auto-deploy to Vercel
│       └── type-check.yml            # TypeScript validation
│
├── .env.local                        # Local environment variables
├── .env.example                      # Example env file
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
└── vercel.json                       # Vercel deployment config
```

---

## 🗄️ DATABASE SCHEMA (Supabase PostgreSQL)

### Core Tables:

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Authentication
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Profile
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  
  -- Campus Info
  university_id UUID REFERENCES universities(id),
  student_id VARCHAR(50),
  student_id_verified BOOLEAN DEFAULT FALSE,
  graduation_year INTEGER,
  
  -- Platform Status
  account_status VARCHAR(20) DEFAULT 'active', -- active, suspended, banned
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Ratings & Stats
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_sales INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  
  -- Metadata
  last_active_at TIMESTAMP WITH TIME ZONE,
  signup_source VARCHAR(50), -- organic, referral, campus_ambassador
  
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_university ON users(university_id);
CREATE INDEX idx_users_status ON users(account_status);
```

#### **universities**
```sql
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  name VARCHAR(255) NOT NULL UNIQUE,
  short_name VARCHAR(50) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  
  -- Contact
  email_domain VARCHAR(100), -- e.g., 'unilag.edu.ng'
  whatsapp_community_link TEXT,
  telegram_channel_link TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  student_count INTEGER,
  
  -- Metadata
  logo_url TEXT,
  timezone VARCHAR(50) DEFAULT 'Africa/Lagos'
);

CREATE INDEX idx_universities_country ON universities(country);
CREATE INDEX idx_universities_active ON universities(is_active);
```

#### **listings**
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ownership
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- electronics, textbooks, housing, services, etc.
  condition VARCHAR(20), -- new, like_new, good, fair, poor
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  is_negotiable BOOLEAN DEFAULT TRUE,
  
  -- Media
  images TEXT[], -- Array of Supabase Storage URLs
  thumbnail_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, sold, expired, rejected
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  chat_initiated_count INTEGER DEFAULT 0,
  
  -- Featured/Premium
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP WITH TIME ZONE,
  boost_count INTEGER DEFAULT 0,
  last_boosted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  tags TEXT[],
  location_detail TEXT, -- e.g., "Moremi Hall, Room 204"
  
  CONSTRAINT valid_price CHECK (price >= 0)
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_university ON listings(university_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_featured ON listings(is_featured, featured_until);
```

#### **chats**
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Participants
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Context
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  archived_by UUID[], -- Array of user IDs who archived this chat
  
  -- Metadata
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,
  
  CONSTRAINT unique_chat_participants UNIQUE (user1_id, user2_id, listing_id),
  CONSTRAINT different_participants CHECK (user1_id != user2_id)
);

CREATE INDEX idx_chats_user1 ON chats(user1_id);
CREATE INDEX idx_chats_user2 ON chats(user2_id);
CREATE INDEX idx_chats_listing ON chats(listing_id);
CREATE INDEX idx_chats_updated ON chats(updated_at DESC);
```

#### **messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Association
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, voice, system
  media_url TEXT,
  media_duration INTEGER, -- For voice notes (in seconds)
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Reply context
  reply_to_id UUID REFERENCES messages(id)
);

CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(chat_id, is_read) WHERE is_read = FALSE;
```

#### **communities**
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  university_id UUID REFERENCES universities(id),
  
  -- Hierarchy
  parent_community_id UUID REFERENCES communities(id), -- For sub-groups
  community_type VARCHAR(50) NOT NULL, -- campus_wide, department, interest, course
  
  -- Settings
  is_public BOOLEAN DEFAULT TRUE,
  auto_approve_members BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  avatar_url TEXT,
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  
  -- Moderation
  created_by UUID REFERENCES users(id),
  admin_ids UUID[], -- Array of admin user IDs
  banned_user_ids UUID[]
);

CREATE INDEX idx_communities_university ON communities(university_id);
CREATE INDEX idx_communities_type ON communities(community_type);
```

#### **community_members**
```sql
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_community_member UNIQUE (community_id, user_id)
);

CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
```

#### **transactions**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Parties
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  
  -- Payment
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  platform_fee DECIMAL(10,2),
  seller_receives DECIMAL(10,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled, disputed, refunded
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255) UNIQUE,
  
  -- Escrow
  escrow_released_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  resolved_by UUID REFERENCES users(id),
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```

#### **admin_actions**
```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  admin_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- approve_listing, reject_listing, ban_user, etc.
  target_type VARCHAR(50), -- listing, user, message, etc.
  target_id UUID,
  
  reason TEXT,
  metadata JSONB,
  
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);
```

---

## 🔐 AUTHENTICATION FLOW

### Phone Number Registration:

```typescript
// Registration Flow (Multi-step)
1. User enters phone number → Validate format
2. Send OTP via SMS (Twilio/Africa's Talking)
3. User enters OTP → Verify code
4. If valid:
   - Create user in Supabase Auth
   - Create profile in users table
   - Hash phone number for duplicate prevention
5. User selects university from dropdown
6. Optional: Upload student ID for verification
7. Session created → Redirect to marketplace

// Security Measures:
- Rate limit: 3 OTP attempts per phone per hour
- Block virtual/VoIP numbers (use numverify.com API)
- Device fingerprinting to detect multi-account abuse
- IP-based geographic validation (Nigeria, Kenya, Ghana only initially)
```

### Session Management:

```typescript
// Using Supabase Auth with cookies (SSR-ready)
import { createServerClient } from '@supabase/ssr'

// In middleware.ts:
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => response.cookies.set(name, value, options),
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  const protectedPaths = ['/market', '/chats', '/profile', '/post']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin-only routes
  const adminPaths = ['/admin']
  const isAdminPath = adminPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (isAdminPath) {
    const { data: user } = await supabase
      .from('users')
      .select('account_status')
      .eq('id', session?.user.id)
      .single()

    if (user?.account_status !== 'admin') {
      return NextResponse.redirect(new URL('/market', request.url))
    }
  }

  return response
}
```

---

## 📱 REAL-TIME FEATURES (Supabase Realtime)

### Chat Real-time Subscriptions:

```typescript
// In src/lib/hooks/use-chat.ts
export function useChat(chatId: string) {
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Subscribe to new messages in this chat
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          // Play notification sound
          playMessageSound()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          // Update message status (read receipt)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new as Message : msg))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, supabase])

  return { messages }
}
```

### Typing Indicators:

```typescript
// Send typing status
async function sendTypingStatus(chatId: string, isTyping: boolean) {
  await supabase
    .channel(`chat:${chatId}:presence`)
    .track({ typing: isTyping, user_id: currentUserId })
}

// Subscribe to typing status
const presenceChannel = supabase
  .channel(`chat:${chatId}:presence`)
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState()
    const typingUsers = Object.values(state)
      .flat()
      .filter((u: { typing: boolean; user_id: string }) => u.typing && u.user_id !== currentUserId)
    
    setTypingUsers(typingUsers)
  })
  .subscribe()
```

### New Listing Notifications:

```typescript
// Subscribe to new listings in user's university
const listingsChannel = supabase
  .channel('new-listings')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'listings',
      filter: `university_id=eq.${userUniversityId}`,
    },
    (payload) => {
      // Show toast notification
      toast.success(`🔥 New listing: ${payload.new.title}`)
      
      // Send to WhatsApp channel (if enabled)
      sendToWhatsAppBroadcast(payload.new)
    }
  )
  .subscribe()
```

---

## 🎨 UI/UX DESIGN PATTERNS

### WhatsApp-Style Components:

#### Chat Bubble Component:
```typescript
// src/components/messaging/chat-bubble.tsx
interface ChatBubbleProps {
  message: Message
  isSender: boolean
  showTimestamp?: boolean
  onReply?: () => void
}

export function ChatBubble({ message, isSender, showTimestamp, onReply }: ChatBubbleProps) {
  return (
    <div className={cn(
      "flex gap-2 mb-2",
      isSender ? "justify-end" : "justify-start"
    )}>
      {!isSender && <Avatar src={message.sender.avatar_url} />}
      
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2",
        isSender 
          ? "bg-green-500 text-white rounded-br-none" 
          : "bg-gray-100 text-gray-900 rounded-bl-none"
      )}>
        {message.reply_to && (
          <div className="text-xs opacity-70 border-l-2 pl-2 mb-1">
            {message.reply_to.content}
          </div>
        )}
        
        {message.message_type === 'text' && <p>{message.content}</p>}
        {message.message_type === 'image' && (
          <img src={message.media_url} alt="" className="rounded-lg" />
        )}
        {message.message_type === 'voice' && (
          <VoiceNotePlayer url={message.media_url} duration={message.media_duration} />
        )}
        
        <div className="flex items-center gap-1 justify-end mt-1">
          {showTimestamp && (
            <span className="text-xs opacity-70">
              {formatTime(message.created_at)}
            </span>
          )}
          {isSender && <MessageStatus status={message.is_read ? 'read' : 'delivered'} />}
        </div>
      </div>
    </div>
  )
}
```

#### Bottom Navigation (Mobile):
```typescript
// src/components/layout/bottom-nav.tsx
export function BottomNav() {
  const pathname = usePathname()
  const { unreadCount } = useUnreadMessages()

  const navItems = [
    { icon: Home, label: 'Market', href: '/market' },
    { icon: MessageCircle, label: 'Chats', href: '/chats', badge: unreadCount },
    { icon: PlusCircle, label: 'Post', href: '/post', isAction: true },
    { icon: Users, label: 'Communities', href: '/communities' },
    { icon: User, label: 'Profile', href: '/profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full relative",
              item.isAction && "transform -translate-y-4"
            )}
          >
            {item.isAction ? (
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <item.icon className="w-6 h-6 text-white" />
              </div>
            ) : (
              <>
                <item.icon className={cn(
                  "w-6 h-6",
                  pathname === item.href ? "text-green-500" : "text-gray-600"
                )} />
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge > 0 && (
                  <Badge className="absolute top-1 right-4 h-5 min-w-5 px-1">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

#### Quick Post Modal (Instagram Story Style):
```typescript
// src/components/listings/quick-post-modal.tsx
export function QuickPostModal() {
  const [images, setImages] = useState<File[]>([])
  const [step, setStep] = useState<'capture' | 'details' | 'confirm'>('capture')

  return (
    <Dialog>
      <DialogContent className="max-w-md h-[80vh] p-0">
        {step === 'capture' && (
          <div className="h-full flex flex-col">
            <CameraCapture onCapture={(file) => {
              setImages([file])
              setStep('details')
            }} />
            <Button onClick={() => document.getElementById('file-upload')?.click()}>
              Choose from Gallery
            </Button>
          </div>
        )}
        
        {step === 'details' && (
          <div className="p-4 space-y-4">
            <img src={URL.createObjectURL(images[0])} className="w-full rounded-lg" />
            
            <Input placeholder="Item title" />
            <Textarea placeholder="Description (optional)" rows={3} />
            
            <div className="flex items-center gap-2">
              <span className="text-3xl">₦</span>
              <Input type="number" placeholder="Price" className="text-2xl" />
            </div>
            
            <CategorySelector />
            
            <Button onClick={handlePost} className="w-full">
              Post to Market
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### Image Optimization:

```typescript
// src/lib/utils/image-processing.ts
import sharp from 'sharp'

export async function optimizeImage(file: File): Promise<Buffer> {
  const buffer = await file.arrayBuffer()
  
  return sharp(Buffer.from(buffer))
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer()
}

export async function generateThumbnail(file: File): Promise<Buffer> {
  const buffer = await file.arrayBuffer()
  
  return sharp(Buffer.from(buffer))
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer()
}

// Usage in upload handler:
const optimized = await optimizeImage(file)
const thumbnail = await generateThumbnail(file)

const { data: upload } = await supabase.storage
  .from('listings')
  .upload(`${userId}/${Date.now()}.jpg`, optimized)
```

### Infinite Scroll Pagination:

```typescript
// src/lib/hooks/use-infinite-scroll.ts
export function useInfiniteScroll<T>(
  queryFn: (page: number) => Promise<T[]>,
  options: { pageSize?: number } = {}
) {
  const [data, setData] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    const newData = await queryFn(page)
    
    if (newData.length < (options.pageSize || 20)) {
      setHasMore(false)
    }
    
    setData((prev) => [...prev, ...newData])
    setPage((p) => p + 1)
    setLoading(false)
  }, [page, loading, hasMore, queryFn])

  // Auto-load when near bottom
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  return { data, loading, hasMore, loadMore }
}
```

### Debounced Search:

```typescript
// src/lib/hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage in search component:
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch)
  }
}, [debouncedSearch])
```

---

## 📊 ANALYTICS & MONITORING

### Event Tracking:

```typescript
// src/lib/utils/analytics.ts
type EventName = 
  | 'listing_created'
  | 'listing_viewed'
  | 'chat_initiated'
  | 'search_performed'
  | 'premium_upgraded'
  | 'transaction_completed'

export function trackEvent(eventName: EventName, properties?: Record<string, any>) {
  // Log to Supabase analytics table
  supabase.from('analytics_events').insert({
    event_name: eventName,
    properties,
    user_id: getCurrentUserId(),
    timestamp: new Date().toISOString(),
  })

  // Send to external analytics (Mixpanel, GA4, etc.)
  if (window.gtag) {
    window.gtag('event', eventName, properties)
  }
}

// Usage:
trackEvent('listing_created', {
  category: 'electronics',
  price: 5000,
  university_id: 'xyz',
})
```

### Performance Monitoring:

```typescript
// In layout.tsx or _app.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 🔗 WHATSAPP BUSINESS API INTEGRATION

### Setup Requirements:

1. **Meta Business Account** - Create at business.facebook.com
2. **WhatsApp Business API Access** - Apply via Meta or partners (360Dialog, Twilio)
3. **Phone Number Verification** - Register business phone number
4. **Message Templates** - Pre-approved templates for notifications

### Sending Broadcast Messages:

```typescript
// src/lib/utils/whatsapp.ts
import axios from 'axios'

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL!
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!

export async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  parameters: Record<string, string>
) {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: Object.entries(parameters).map(([key, value]) => ({
                type: 'text',
                text: value,
              })),
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error) {
    console.error('WhatsApp send error:', error)
    throw error
  }
}

// Pre-approved template example:
// Template Name: new_listing_alert
// Template Content:
// "🔥 New listing on Campus Market!
//  {{1}} - ₦{{2}}
//  Posted by {{3}} at {{4}}
//  
//  View details: {{5}}"

export async function notifyNewListing(listing: Listing) {
  const users = await getSubscribedUsers(listing.university_id)
  
  for (const user of users) {
    if (user.whatsapp_notifications_enabled) {
      await sendWhatsAppMessage(
        user.phone_number,
        'new_listing_alert',
        {
          '1': listing.title,
          '2': listing.price.toString(),
          '3': listing.seller.username,
          '4': listing.university.name,
          '5': `https://campusmarket.com/l/${listing.id}`,
        }
      )
    }
  }
}
```

### Webhook Handler (Receiving Messages):

```typescript
// src/app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Verify webhook signature
  const signature = request.headers.get('x-hub-signature-256')
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Process incoming message
  const entry = body.entry?.[0]
  const change = entry?.changes?.[0]
  const message = change?.value?.messages?.[0]

  if (message) {
    const from = message.from
    const text = message.text?.body

    // Handle user responses (e.g., "STOP" to unsubscribe)
    if (text?.toUpperCase() === 'STOP') {
      await supabase
        .from('users')
        .update({ whatsapp_notifications_enabled: false })
        .eq('phone_number', `+${from}`)
    }

    // Auto-reply with help info
    await sendWhatsAppMessage(from, 'help_message', {})
  }

  return NextResponse.json({ success: true })
}

// Webhook verification (for initial setup)
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}
```

---

## 💳 PAYMENT INTEGRATION (Paystack/Flutterwave)

### Transaction Flow:

```typescript
// src/lib/api/payments.ts
import { Paystack } from 'paystack'

const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!)

export async function initializeTransaction(
  amount: number,
  email: string,
  metadata: Record<string, any>
) {
  const response = await paystack.transaction.initialize({
    amount: amount * 100, // Convert to kobo
    email,
    currency: 'NGN',
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
    metadata: {
      ...metadata,
      cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/market`,
    },
  })

  return response.data
}

export async function verifyTransaction(reference: string) {
  const response = await paystack.transaction.verify(reference)
  return response.data
}

// Premium subscription purchase:
export async function upgradeToPremium(userId: string) {
  const user = await getUserById(userId)
  
  const transaction = await initializeTransaction(
    499, // ₦499/month
    user.email,
    {
      user_id: userId,
      transaction_type: 'premium_subscription',
    }
  )

  return transaction.authorization_url
}
```

### Webhook Handler:

```typescript
// src/app/api/webhooks/payment/route.ts
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const { reference, metadata, amount } = event.data

    // Update user premium status
    if (metadata.transaction_type === 'premium_subscription') {
      await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })
        .eq('id', metadata.user_id)

      // Log transaction
      await supabase.from('transactions').insert({
        buyer_id: metadata.user_id,
        amount: amount / 100,
        status: 'completed',
        payment_reference: reference,
        payment_method: 'paystack',
      })
    }
  }

  return NextResponse.json({ success: true })
}
```

---

## 🛡️ SECURITY MEASURES

### Rate Limiting:

```typescript
// src/lib/utils/rate-limit.ts
import { RateLimiter } from 'limiter'

const limiters = new Map<string, RateLimiter>()

export function getRateLimiter(key: string, tokensPerInterval: number, interval: 'second' | 'minute' | 'hour') {
  if (!limiters.has(key)) {
    limiters.set(key, new RateLimiter({
      tokensPerInterval,
      interval,
    }))
  }
  return limiters.get(key)!
}

// Usage in API route:
export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const limiter = getRateLimiter(`post-listing:${ip}`, 5, 'hour')

  const allowed = await limiter.tryRemoveTokens(1)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    )
  }

  // Process request...
}
```

### Input Validation (Zod):

```typescript
// src/lib/utils/validation.ts
import { z } from 'zod'

export const listingSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().min(10).max(2000),
  price: z.number().min(0).max(10000000),
  category: z.enum(['electronics', 'textbooks', 'housing', 'services', 'fashion', 'other']),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  images: z.array(z.string().url()).min(1).max(10),
  is_negotiable: z.boolean().default(true),
})

export const messageSchema = z.object({
  chat_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  message_type: z.enum(['text', 'image', 'voice']).default('text'),
  media_url: z.string().url().optional(),
})

// Usage:
export async function createListing(data: unknown) {
  const validated = listingSchema.parse(data) // Throws if invalid
  
  // Sanitize HTML content
  validated.description = sanitizeHtml(validated.description, {
    allowedTags: [],
    allowedAttributes: {},
  })

  // Proceed with creation...
}
```

### XSS Prevention:

```typescript
// Always use proper escaping in components
import DOMPurify from 'isomorphic-dompurify'

function ListingDescription({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  })

  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

---

## 🧪 TESTING STRATEGY

### Unit Tests (Vitest):

```typescript
// tests/unit/utils/formatting.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPhoneNumber } from '@/lib/utils/formatting'

describe('formatCurrency', () => {
  it('formats Nigerian Naira correctly', () => {
    expect(formatCurrency(1000, 'NGN')).toBe('₦1,000')
  })

  it('handles decimal places', () => {
    expect(formatCurrency(1234.56, 'NGN')).toBe('₦1,234.56')
  })
})

describe('formatPhoneNumber', () => {
  it('formats Nigerian numbers', () => {
    expect(formatPhoneNumber('08012345678')).toBe('+234 801 234 5678')
  })
})
```

### Integration Tests:

```typescript
// tests/integration/api/listings.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Listings API', () => {
  let supabase: ReturnType<typeof createClient>
  let testUser: { email: string; password: string }

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create test user
    const { data } = await supabase.auth.admin.createUser({
      email: 'test@test.com',
      password: 'password123',
    })
    testUser = data.user
  })

  it('creates a listing successfully', async () => {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: testUser.id,
        title: 'Test iPhone',
        description: 'A test listing',
        price: 5000,
        category: 'electronics',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.title).toBe('Test iPhone')
  })
})
```

### E2E Tests (Playwright):

```typescript
// tests/e2e/user-flows/post-listing.spec.ts
import { test, expect } from '@playwright/test'

test('user can post a new listing', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="phone"]', '+2348012345678')
  await page.click('button[type="submit"]')
  
  // Enter OTP (in test mode, use fixed OTP)
  await page.fill('[name="otp"]', '123456')
  await page.click('button:has-text("Verify")')

  // Navigate to post page
  await page.click('[href="/post"]')

  // Fill listing form
  await page.fill('[name="title"]', 'iPhone 13 Pro Max')
  await page.fill('[name="description"]', 'Brand new, never used')
  await page.fill('[name="price"]', '450000')
  await page.selectOption('[name="category"]', 'electronics')

  // Upload image
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/iphone.jpg')

  // Submit
  await page.click('button:has-text("Post Listing")')

  // Verify success
  await expect(page).toHaveURL(/\/market\/[a-z0-9-]+/)
  await expect(page.locator('h1')).toContainText('iPhone 13 Pro Max')
})
```

---

## 🚀 DEPLOYMENT & CI/CD

### Vercel Configuration:

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "WHATSAPP_API_URL": "@whatsapp-api-url",
    "WHATSAPP_ACCESS_TOKEN": "@whatsapp-token",
    "PAYSTACK_SECRET_KEY": "@paystack-secret"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### GitHub Actions Workflow:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📈 SCALABILITY CONSIDERATIONS

### Database Indexing Strategy:

```sql
-- High-traffic query optimization
CREATE INDEX CONCURRENTLY idx_listings_active_featured 
ON listings (university_id, status, is_featured, created_at DESC)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_messages_chat_unread
ON messages (chat_id, created_at DESC)
WHERE is_read = FALSE;

CREATE INDEX CONCURRENTLY idx_users_active_premium
ON users (university_id, is_premium, last_active_at DESC)
WHERE account_status = 'active';
```

### Caching Strategy:

```typescript
// Use React Query for client-side caching
import { useQuery } from '@tanstack/react-query'

export function useListings(universityId: string) {
  return useQuery({
    queryKey: ['listings', universityId],
    queryFn: () => fetchListings(universityId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Server-side caching with Redis (optional for scale)
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function getCachedListings(universityId: string) {
  const cached = await redis.get(`listings:${universityId}`)
  
  if (cached) {
    return JSON.parse(cached)
  }

  const listings = await fetchListingsFromDB(universityId)
  await redis.setex(`listings:${universityId}`, 300, JSON.stringify(listings)) // 5min TTL
  
  return listings
}
```

### CDN for Static Assets:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
  },
}
```

---

## 🎯 FEATURE ROADMAP

### Phase 1 (Month 1-2): Core Marketplace ✅
- [x] User authentication (phone number)
- [x] Basic listing CRUD
- [x] Simple search/filters
- [ ] **Real-time chat (1-on-1)** ← PRIORITY
- [ ] **Admin approval system** ← PRIORITY
- [ ] Image upload to Supabase Storage

### Phase 2 (Month 3-4): WhatsApp Integration 🚧
- [ ] WhatsApp Business API setup
- [ ] Broadcast channel for new listings
- [ ] OTP via WhatsApp (alternative to SMS)
- [ ] "Chat on WhatsApp" quick button
- [ ] Community/group structure

### Phase 3 (Month 5-6): Monetization 💰
- [ ] Premium tier implementation
- [ ] Transaction fee system (escrow)
- [ ] Featured listings
- [ ] Payment integration (Paystack)
- [ ] Analytics dashboard for admins

### Phase 4 (Month 7-9): Advanced Features 🔥
- [ ] Voice notes in chat
- [ ] AI-powered auto-categorization
- [ ] Price recommendation engine
- [ ] Campus verification (student ID upload)
- [ ] Rating & review system
- [ ] Dispute resolution system

### Phase 5 (Month 10-12): Scale & Polish 🚀
- [ ] Multi-language support
- [ ] Desktop web app (enhanced UX)
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics
- [ ] Referral program
- [ ] Campus ambassador dashboard

---

## 🔧 ENVIRONMENT VARIABLES

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://campusmarket.com
NEXT_PUBLIC_APP_NAME="Campus Market P2P"

# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/YOUR_PHONE_ID
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_VERIFY_TOKEN=your-random-verify-token

# SMS (Twilio / Africa's Talking)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment (Paystack / Flutterwave)
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=5242880  # 5MB
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Security
ENCRYPTION_KEY=your-32-char-encryption-key
JWT_SECRET=your-jwt-secret

# Admin
ADMIN_EMAILS=admin1@campus.com,admin2@campus.com
```

---

## ⚠️ CRITICAL UPGRADE RULES

### Non-Negotiable Principles:

1. **No Feature Regressions**
   - Every new feature MUST NOT break existing functionality
   - Run full test suite before any deployment
   - Use feature flags for gradual rollouts

2. **Zero Downtime Deployments**
   - Use Vercel's preview deployments for testing
   - Database migrations MUST be backward-compatible
   - Always add columns as nullable first, then backfill

3. **Type Safety Enforcement**
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noImplicitReturns": true
     }
   }
   ```

4. **Performance Budgets**
   - First Contentful Paint: < 1.5s
   - Largest Contentful Paint: < 2.5s
   - Time to Interactive: < 3.5s
   - Cumulative Layout Shift: < 0.1

5. **Database Migration Safety**
   ```sql
   -- WRONG: Breaking change
   ALTER TABLE users DROP COLUMN old_field;

   -- RIGHT: Deprecate then remove
   ALTER TABLE users ADD COLUMN new_field TEXT;
   -- Deploy code using new_field
   -- Wait 1 week
   -- Verify no errors
   -- Then: ALTER TABLE users DROP COLUMN old_field;
   ```

---

## 📚 ADDITIONAL RESOURCES

### Key Documentation Links:
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/business-management-api)
- [Paystack Integration](https://paystack.com/docs/api/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**END OF ARCHITECTURE DOCUMENT**

*This architecture is designed for incremental, safe upgrades while maintaining production stability. All additions should extend, not replace, existing functionality.*
