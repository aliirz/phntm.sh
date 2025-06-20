import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile with subscription info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        subscriptions (
          id,
          stripe_subscription_id,
          status,
          current_period_start,
          current_period_end
        )
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User lookup error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get file transfer statistics
    const { data: sessionStats, error: statsError } = await supabase
      .from('file_sessions')
      .select('file_size, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (statsError) {
      console.error('Stats lookup error:', statsError);
    }

    // Calculate usage statistics
    const totalTransfers = sessionStats?.length || 0;
    const successfulTransfers = sessionStats?.filter(s => s.status === 'completed').length || 0;
    const totalBytesTransferred = sessionStats?.reduce((sum, s) => sum + (s.file_size || 0), 0) || 0;

    // Check if quota needs reset
    const now = new Date();
    const quotaResetDate = new Date(user.quota_reset_date);
    
    if (now > quotaResetDate) {
      // Reset quota
      const { error: resetError } = await supabase.rpc('reset_monthly_quota');
      if (resetError) {
        console.error('Error resetting quota:', resetError);
      } else {
        user.monthly_shared = 0;
        user.quota_reset_date = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        is_pro: user.is_pro,
        monthly_shared: user.monthly_shared,
        max_file_size: user.max_file_size,
        max_monthly_quota: user.max_monthly_quota,
        quota_reset_date: user.quota_reset_date,
        created_at: user.created_at,
      },
      subscription: user.subscriptions?.[0] || null,
      stats: {
        total_transfers: totalTransfers,
        successful_transfers: successfulTransfers,
        total_bytes_transferred: totalBytesTransferred,
        success_rate: totalTransfers > 0 ? (successfulTransfers / totalTransfers) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Profile lookup error:', error);
    return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, file_size } = await request.json();

    if (!user_id || !file_size) {
      return NextResponse.json({ error: 'User ID and file size are required' }, { status: 400 });
    }

    // Get user to check limits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check file size limit
    if (file_size > user.max_file_size) {
      return NextResponse.json({
        error: 'File size exceeds limit',
        max_file_size: user.max_file_size,
        is_pro: user.is_pro,
      }, { status: 413 });
    }

    // Check monthly quota
    if (user.monthly_shared + file_size > user.max_monthly_quota) {
      return NextResponse.json({
        error: 'Monthly quota exceeded',
        monthly_shared: user.monthly_shared,
        max_monthly_quota: user.max_monthly_quota,
        is_pro: user.is_pro,
      }, { status: 429 });
    }

    return NextResponse.json({ 
      allowed: true,
      remaining_quota: user.max_monthly_quota - user.monthly_shared,
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return NextResponse.json({ error: 'Failed to check quota' }, { status: 500 });
  }
} 