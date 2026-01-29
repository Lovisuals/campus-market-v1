/**
 * CAMPUS MARKET P2P - Type Definitions
 * All TypeScript interfaces and types for the platform
 */

// ============= USER TYPES =============
export interface User {
  id: string;
  phone_number: string;
  full_name: string;
  email?: string;
  profile_picture_url?: string;
  campus: string;
  bio?: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_admin: boolean;
  is_elite: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  total_sold: number;
  total_bought: number;
  response_time_minutes: number;
  completion_rate: number;
}

// ============= LISTING TYPES =============
export interface Listing {
  id: string;
  seller_id: string;
  seller?: User;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price?: number;
  budget?: number;
  currency: string;
  images: string[];
  thumbnail_url?: string;
  campus: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  is_request: boolean;
  is_verified: boolean;
  is_approved: boolean;
  status: 'active' | 'sold' | 'archived';
  views: number;
  saved_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface ListingFilters {
  category?: string;
  campus?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  isRequest?: boolean;
  sortBy?: 'recent' | 'popular' | 'price-low' | 'price-high';
  searchQuery?: string;
}

export interface ListingWithSeller extends Listing {
  seller: User;
  seller_stats?: {
    response_time: number;
    completion_rate: number;
    total_sales: number;
  };
}

// ============= MESSAGING TYPES =============
export interface Chat {
  id: string;
  listing_id?: string;
  participant_ids: string[];
  participants?: User[];
  last_message?: Message;
  last_message_time?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  message_type: 'text' | 'image' | 'offer' | 'system';
  image_url?: string;
  offer_data?: OfferData;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OfferData {
  price: number;
  listing_id: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  campus: string;
  icon_url?: string;
  member_count: number;
  is_official: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============= TRANSACTION TYPES =============
export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'disputed' | 'cancelled';
  payment_method?: 'paystack' | 'flutterwave' | 'cash' | 'bank_transfer';
  reference?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============= ADMIN TYPES =============
export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: 'approve_listing' | 'reject_listing' | 'suspend_user' | 'warn_user' | 'delete_content';
  target_id: string;
  target_type: 'listing' | 'user' | 'message' | 'review';
  reason?: string;
  notes?: string;
  created_at: string;
}

export interface FlaggedContent {
  id: string;
  content_id: string;
  content_type: 'listing' | 'message' | 'profile' | 'review';
  reporter_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// ============= ANALYTICS TYPES =============
export interface PlatformStats {
  total_users: number;
  total_listings: number;
  total_transactions: number;
  total_gmv: number;
  active_campuses: number;
  avg_response_time: number;
  completion_rate: number;
  updated_at: string;
}

// ============= FORM TYPES =============
export interface LoginFormData {
  phone_number: string;
}

export interface VerifyOTPFormData {
  phone_number: string;
  otp: string;
}

export interface RegisterFormData {
  phone_number: string;
  full_name: string;
  email?: string;
  campus: string;
  otp: string;
}

export interface CreateListingFormData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price?: number;
  budget?: number;
  campus: string;
  condition: string;
  images: File[];
  is_request: boolean;
}

// ============= API RESPONSE TYPES =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============= UI STATE TYPES =============
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}
