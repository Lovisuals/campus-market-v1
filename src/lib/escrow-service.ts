import { createClient } from '@/lib/supabase/client';
import { validateTransactionIntegrity } from './transaction-service';

export async function receiveFundsToEscrow(
  transactionId: string,
  buyerId: string,
  amount: number,
  paymentRef: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (!tx) {
    return { success: false, error: 'Transaction not found' };
  }

  if (tx.status !== 'approved') {
    return { success: false, error: 'Transaction not approved' };
  }

  if (amount < tx.total_price) {
    return { success: false, error: 'Insufficient amount' };
  }

  if (!await validateTransactionIntegrity(transactionId)) {
    return { success: false, error: 'Transaction integrity check failed' };
  }

  const { error } = await supabase
    .from('escrow_accounts')
    .insert({
      transaction_id: transactionId,
      buyer_id: buyerId,
      admin_id: tx.admin_id,
      seller_id: tx.seller_id,
      amount: tx.total_price,
      admin_commission: tx.admin_commission_amount,
      seller_amount: tx.base_price,
      payment_ref: paymentRef,
      status: 'held',
      created_at: new Date()
    });

  if (error) {
    return { success: false, error: 'Escrow creation failed' };
  }

  await supabase
    .from('transactions')
    .update({ status: 'in_escrow' })
    .eq('id', transactionId);

  return { success: true };
}

export async function releaseFundsFromEscrow(
  escrowId: string,
  adminId: string,
  confirmationProof: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: escrow } = await supabase
    .from('escrow_accounts')
    .select('*, transactions(*)')
    .eq('id', escrowId)
    .single();

  if (!escrow) {
    return { success: false, error: 'Escrow not found' };
  }

  if (escrow.status !== 'held') {
    return { success: false, error: 'Escrow not in held status' };
  }

  if (escrow.admin_id !== adminId) {
    return { success: false, error: 'Unauthorized' };
  }

  const tx = escrow.transactions[0];
  if (!await validateTransactionIntegrity(tx.id)) {
    return { success: false, error: 'Transaction validation failed' };
  }

  const { error: releaseError } = await supabase
    .from('escrow_accounts')
    .update({
      status: 'released',
      released_at: new Date(),
      confirmation_proof: confirmationProof
    })
    .eq('id', escrowId);

  if (releaseError) {
    return { success: false, error: 'Release failed' };
  }

  await supabase
    .from('payout_logs')
    .insert([
      {
        transaction_id: tx.id,
        recipient: escrow.seller_id,
        amount: escrow.seller_amount,
        type: 'seller_payout',
        status: 'pending'
      },
      {
        transaction_id: tx.id,
        recipient: escrow.admin_id,
        amount: escrow.admin_commission,
        type: 'admin_commission',
        status: 'pending'
      }
    ]);

  return { success: true };
}
