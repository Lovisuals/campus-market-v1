import crypto from 'crypto';

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  status: 'pending' | 'escrow_held' | 'completed' | 'refunded' | 'disputed';
  created_at: Date;
  completed_at?: Date;
  escrow_release_date?: Date;
  admin_fee: number;
  seller_amount: number;
  dispute_reason?: string;
  payment_method: 'paystack' | 'flutterwave' | 'bank_transfer';
}

/**
 * Initialize a transaction with escrow
 * Funds are held by admin until delivery confirmation
 */
export async function initiateTransaction(
  buyerId: string,
  sellerId: string,
  listingId: string,
  amount: number,
  paymentMethod: string = 'paystack',
  supabase: any
): Promise<{ transactionId: string; error?: string }> {

  const adminFee = amount * 0.05; // 5% admin commission
  const sellerAmount = amount - adminFee;

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      amount,
      admin_fee: adminFee,
      seller_amount: sellerAmount,
      status: 'pending',
      payment_method: paymentMethod,
      created_at: new Date(),
      escrow_release_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })
    .select()
    .single();

  if (error) {
    return { transactionId: '', error: 'Failed to create transaction' };
  }

  return { transactionId: transaction.id };
}

/**
 * Move funds to escrow after successful payment
 */
export async function holdFundsInEscrow(transactionId: string, supabase: any): Promise<{ success: boolean; error?: string }> {

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  // Create escrow record
  const { error: escrowError } = await supabase.from('escrow_accounts').insert({
    transaction_id: transactionId,
    amount: transaction.amount,
    held_by: 'admin',
    status: 'held',
    held_at: new Date(),
    release_date: transaction.escrow_release_date
  });

  if (escrowError) {
    return { success: false, error: 'Escrow creation failed' };
  }

  // Update transaction status
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ status: 'escrow_held' })
    .eq('id', transactionId);

  if (updateError) {
    return { success: false, error: 'Status update failed' };
  }

  return { success: true };
}

/**
 * Buyer confirms delivery and initiates payment release
 */
export async function confirmDelivery(
  transactionId: string,
  buyerId: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> {

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('buyer_id', buyerId)
    .single();

  if (fetchError || !transaction) {
    return { success: false, error: 'Transaction not found or unauthorized' };
  }

  if (transaction.status !== 'escrow_held') {
    return { success: false, error: 'Transaction is not in escrow' };
  }

  // Release funds to seller
  const { error: releaseError } = await supabase.from('escrow_accounts').update({
    status: 'released',
    released_at: new Date()
  }).eq('transaction_id', transactionId);

  if (releaseError) {
    return { success: false, error: 'Escrow release failed' };
  }

  // Update transaction as completed
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      completed_at: new Date()
    })
    .eq('id', transactionId);

  if (updateError) {
    return { success: false, error: 'Transaction update failed' };
  }

  // Create payout record for seller
  await supabase.from('payouts').insert({
    transaction_id: transactionId,
    seller_id: transaction.seller_id,
    amount: transaction.seller_amount,
    status: 'pending',
    scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day payout
  });

  return { success: true };
}

/**
 * Refund transaction if buyer disputes or payment fails
 */
export async function refundTransaction(
  transactionId: string,
  reason: string,
  authorizedBy: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> {

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  // Release escrow funds back to buyer
  const { error: escrowError } = await supabase.from('escrow_accounts').update({
    status: 'refunded',
    released_at: new Date()
  }).eq('transaction_id', transactionId);

  if (escrowError) {
    return { success: false, error: 'Escrow update failed' };
  }

  // Update transaction
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      status: 'refunded',
      dispute_reason: reason,
      completed_at: new Date()
    })
    .eq('id', transactionId);

  if (updateError) {
    return { success: false, error: 'Transaction update failed' };
  }

  // Log refund audit trail
  await supabase.from('audit_logs').insert({
    action: 'refund_processed',
    entity_type: 'transaction',
    entity_id: transactionId,
    performed_by: authorizedBy,
    reason: reason,
    timestamp: new Date()
  });

  return { success: true };
}

/**
 * Open dispute for transaction
 */
export async function openDispute(
  transactionId: string,
  userId: string,
  reason: string,
  supabase: any
): Promise<{ disputeId: string; error?: string }> {

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    return { disputeId: '', error: 'Transaction not found' };
  }

  // Check if user is buyer or seller
  if (userId !== transaction.buyer_id && userId !== transaction.seller_id) {
    return { disputeId: '', error: 'Unauthorized' };
  }

  const { data: dispute, error: disputeError } = await supabase
    .from('disputes')
    .insert({
      transaction_id: transactionId,
      opened_by: userId,
      reason: reason,
      status: 'open',
      opened_at: new Date()
    })
    .select()
    .single();

  if (disputeError) {
    return { disputeId: '', error: 'Failed to create dispute' };
  }

  // Update transaction status
  await supabase
    .from('transactions')
    .update({ status: 'disputed' })
    .eq('id', transactionId);

  return { disputeId: dispute.id };
}

/**
 * Get transaction history for user
 */
export async function getTransactionHistory(userId: string, limit: number = 20, supabase: any) {

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      listings:listing_id(title, price),
      buyer:buyer_id(name, phone),
      seller:seller_id(name, phone)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { transactions: [], error: error.message };
  }

  return { transactions, error: null };
}

/**
 * Calculate admin revenue from commission
 */
export async function getAdminRevenue(startDate: Date, endDate: Date, supabase: any) {

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('admin_fee')
    .eq('status', 'completed')
    .gte('completed_at', startDate.toISOString())
    .lte('completed_at', endDate.toISOString());

  if (error) {
    return { revenue: 0, transactionCount: 0, error: error.message };
  }

  const revenue = transactions.reduce((sum, t) => sum + (t.admin_fee || 0), 0);

  return { revenue, transactionCount: transactions.length, error: null };
}

/**
 * Generate transaction receipt
 */
export async function generateReceipt(transactionId: string, supabase: any) {

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select(`
      *,
      listings(title, price),
      buyer:buyer_id(name, email, phone),
      seller:seller_id(name, email, phone)
    `)
    .eq('id', transactionId)
    .single();

  if (error || !transaction) {
    return { receipt: null, error: 'Transaction not found' };
  }

  const receipt = {
    transactionId: transaction.id,
    date: new Date(transaction.created_at).toLocaleDateString(),
    buyer: transaction.buyer,
    seller: transaction.seller,
    item: transaction.listings?.title,
    originalPrice: transaction.amount,
    adminFee: transaction.admin_fee,
    sellerReceives: transaction.seller_amount,
    status: transaction.status,
    estimatedDelivery: new Date(transaction.escrow_release_date).toLocaleDateString()
  };

  return { receipt, error: null };
}
