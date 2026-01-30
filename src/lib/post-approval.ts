import { createClient } from '@/lib/supabase/client';

export async function submitPostForApproval(
  postData: {
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
  },
  userId: string
): Promise<{ postId: string; error?: string }> {
  const supabase = createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      seller_id: userId,
      title: postData.title,
      description: postData.description,
      price: postData.price,
      category: postData.category,
      images: postData.images,
      status: 'pending_approval',
      submitted_at: new Date()
    })
    .select()
    .single();

  if (error) {
    return { postId: '', error: 'Post creation failed' };
  }

  await supabase
    .from('approval_queue')
    .insert({
      post_id: post.id,
      submitted_by: userId,
      submitted_at: new Date(),
      status: 'awaiting_review'
    });

  return { postId: post.id };
}

export async function getApprovalQueue(adminId: string) {
  const supabase = createClient();

  const { data: isAdmin } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', adminId)
    .single();

  if (!isAdmin) {
    throw new Error('Unauthorized');
  }

  const { data: queue } = await supabase
    .from('approval_queue')
    .select(`
      *,
      posts(*)
    `)
    .eq('status', 'awaiting_review')
    .order('submitted_at', { ascending: true });

  return queue;
}

export async function rejectPost(
  postId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('posts')
    .update({
      status: 'rejected',
      rejected_reason: reason,
      rejected_at: new Date()
    })
    .eq('id', postId);

  if (error) {
    return { success: false, error: 'Update failed' };
  }

  await supabase
    .from('approval_queue')
    .update({ status: 'rejected' })
    .eq('post_id', postId);

  return { success: true };
}
