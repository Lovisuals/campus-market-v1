import { z } from 'zod';

// User schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  campus: z.string().min(2, 'Campus name required').max(100),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number').optional(),
});

export const UserProfileSchema = z.object({
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number'),
  full_name: z.string().min(2).max(100),
  campus: z.string().min(2).max(100),
});

// Listing schemas
export const CreateListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  price: z.number().positive('Price must be positive').max(10000000, 'Price too high'),
  category: z.enum(['electronics', 'books', 'clothing', 'furniture', 'other']),
  campus: z.string().min(2).max(100),
  images: z.array(z.string().url()).min(1, 'At least one image required').max(10, 'Maximum 10 images'),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional(),
  negotiable: z.boolean().optional(),
});

export const UpdateListingSchema = CreateListingSchema.partial().extend({
  id: z.string().uuid(),
});

// Message schemas
export const SendMessageSchema = z.object({
  recipient_id: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  listing_id: z.string().uuid().optional(),
});

// OTP schemas
export const SendOTPSchema = z.object({
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number'),
});

export const VerifyOTPSchema = z.object({
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number'),
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Transaction schemas
export const CreateTransactionSchema = z.object({
  listing_id: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.enum(['paystack', 'flutterwave', 'bank_transfer']),
});

export const UpdateTransactionStatusSchema = z.object({
  transaction_id: z.string().uuid(),
  status: z.enum(['pending', 'completed', 'cancelled', 'disputed']),
  notes: z.string().max(1000).optional(),
});

// Review schemas
export const CreateReviewSchema = z.object({
  seller_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  transaction_id: z.string().uuid(),
});

// Report schemas
export const CreateReportSchema = z.object({
  reported_user_id: z.string().uuid().optional(),
  listing_id: z.string().uuid().optional(),
  reason: z.enum(['spam', 'fraud', 'inappropriate', 'harassment', 'other']),
  description: z.string().min(20, 'Please provide details').max(1000),
});

// Admin schemas
export const AdminActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'ban', 'unban', 'delete']),
  target_id: z.string().uuid(),
  target_type: z.enum(['user', 'listing', 'review']),
  reason: z.string().max(500).optional(),
});

// Validation helper
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        success: false, 
        error: `${firstError.path.join('.')}: ${firstError.message}` 
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
