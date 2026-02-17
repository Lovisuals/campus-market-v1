import crypto from 'crypto';

/**
 * Generate a cryptographic hash for transaction integrity verification
 */
function generateTransactionHash(
  listingId: string,
  sellerId: string,
  basePrice: number,
  commission: number,
  totalPrice: number
): string {
  const data = `${listingId}${sellerId}${basePrice}${commission}${totalPrice}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify transaction hasn't been tampered with
 */
async function verifyTransactionIntegrity(
  transactionId: string,
  supabase: any
): Promise<{ valid: boolean; error?: string }> {
  const { data: tx, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error || !tx) {
    return { valid: false, error: 'Transaction not found' };
  }

  const calculatedHash = generateTransactionHash(
    tx.listing_id,
    tx.seller_id,
    tx.base_price,
    tx.commission,
    tx.total_price
  );

  if (tx.hash && tx.hash !== calculatedHash) {
    return { valid: false, error: 'Transaction integrity check failed - data has been modified' };
  }

  // Verify math is correct
  if (tx.total_price !== tx.base_price + tx.commission) {
    return { valid: false, error: 'Transaction math does not match' };
  }

  return { valid: true };
}

/**
 * Log escrow action to audit trail
 */
async function logEscrowAction(
  action: string,
  transactionId: string,
  userId: string,
  details: any,
  supabase: any
): Promise<void> {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: 'escrow',
    entity_id: transactionId,
    after_state: details,
    created_at: new Date().toISOString()
  });
}

export async function receiveFundsToEscrow(
  transactionId: string,
  buyerId: string,
  amount: number,
  paymentRef: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> {

  // Verify transaction integrity first
  const integrityCheck = await verifyTransactionIntegrity(transactionId, supabase);
  if (!integrityCheck.valid) {
    await logEscrowAction(
      'ESCROW_INTEGRITY_FAILURE',
      transactionId,
      buyerId,
      { error: integrityCheck.error },
      supabase
    );
    return { success: false, error: integrityCheck.error };
  }

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (txError || !tx) {
    return { success: false, error: 'Transaction not found' };
  }

  if (tx.status !== 'approved') {
    return { success: false, error: 'Transaction not approved' };
  }

  if (amount < tx.total_price) {
    await logEscrowAction(
      'ESCROW_INSUFFICIENT_FUNDS',
      transactionId,
      buyerId,
      { expected: tx.total_price, received: amount },
      supabase
    );
    return { success: false, error: 'Insufficient amount' };
  }

  const { error } = await supabase
    .from('escrow_accounts')
    .insert({
      transaction_id: transactionId,
      buyer_id: buyerId,
      admin_id: tx.admin_id,
      seller_id: tx.seller_id,
      amount: tx.total_price,
      admin_commission: tx.commission,
      seller_amount: tx.base_price,
      payment_ref: paymentRef,
      status: 'held',
      created_at: new Date().toISOString()
    });

  if (error) {
    await logEscrowAction(
      'ESCROW_CREATION_FAILED',
      transactionId,
      buyerId,
      { error: error.message },
      supabase
    );
    return { success: false, error: 'Escrow creation failed' };
  }

  await supabase
    .from('transactions')
    .update({ status: 'in_escrow' })
    .eq('id', transactionId);

  await logEscrowAction(
    'ESCROW_FUNDS_RECEIVED',
    transactionId,
    buyerId,
    { amount, paymentRef },
    supabase
  );

  return { success: true };
}

export async function releaseFundsFromEscrow(
  escrowId: string,
  adminId: string,
  confirmationProof: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> {

  const { data: escrow, error: escrowError } = await supabase
    .from('escrow_accounts')
    .select('*, transactions(*)')
    .eq('id', escrowId)
    .single();

  if (escrowError || !escrow) {
    return { success: false, error: 'Escrow not found' };
  }

  if (escrow.status !== 'held') {
    return { success: false, error: 'Escrow not in held status' };
  }

  // Verify admin has permission
  const { data: admin } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', adminId)
    .single();

  if (!admin || !admin.is_admin) {
    await logEscrowAction(
      'ESCROW_UNAUTHORIZED_RELEASE_ATTEMPT',
      escrow.transaction_id,
      adminId,
      { escrowId },
      supabase
    );
    return { success: false, error: 'Unauthorized' };
  }

  // Verify transaction integrity again before release
  const integrityCheck = await verifyTransactionIntegrity(
    escrow.transaction_id,
    supabase
  );

  if (!integrityCheck.valid) {
    await logEscrowAction(
      'ESCROW_RELEASE_INTEGRITY_FAILURE',
      escrow.transaction_id,
      adminId,
      { error: integrityCheck.error, escrowId },
      supabase
    );
    return { success: false, error: 'Transaction integrity check failed' };
  }

  const tx = escrow.transactions;

  const { error: releaseError } = await supabase
    .from('escrow_accounts')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
      released_by: adminId,
      confirmation_proof: confirmationProof
    })
    .eq('id', escrowId);

  if (releaseError) {
    await logEscrowAction(
      'ESCROW_RELEASE_FAILED',
      escrow.transaction_id,
      adminId,
      { error: releaseError.message, escrowId },
      supabase
    );
    return { success: false, error: 'Release failed' };
  }

  // Create payout records
  await supabase
    .from('payout_logs')
    .insert([
      {
        transaction_id: escrow.transaction_id,
        recipient_id: escrow.seller_id,
        amount: escrow.seller_amount,
        type: 'seller_payout',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        transaction_id: escrow.transaction_id,
        recipient_id: escrow.admin_id,
        amount: escrow.admin_commission,
        type: 'admin_commission',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);

  // Update transaction status
  await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .eq('id', escrow.transaction_id);

  await logEscrowAction(
    'ESCROW_FUNDS_RELEASED',
    escrow.transaction_id,
    adminId,
    {
      escrowId,
      sellerAmount: escrow.seller_amount,
      adminCommission: escrow.admin_commission,
      confirmationProof
    },
    supabase
  );

  return { success: true };
}
