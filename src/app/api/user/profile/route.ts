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
      
      // If user doesn't exist, try to create it automatically
      if (userError.code === 'PGRST116') {
        console.log('User not found, attempting to create profile...');
        
        try {
          // Get user email from Supabase Auth
          const { data: authData } = await supabase.auth.admin.getUserById(userId);
          
          if (authData.user?.email) {
            console.log('Creating new user profile for:', authData.user.email);
            
            // Create new user profile
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authData.user.email,
                is_pro: false,
                max_file_size: 100 * 1024 * 1024, // 100MB
                max_monthly_quota: 10 * 1024 * 1024 * 1024, // 10GB
                monthly_shared: 0,
                quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .select()
              .single();
              
            if (createError) {
              console.error('Error creating user profile:', createError);
              return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
            }
            
            console.log('Successfully created user profile');
            
            // Return the newly created user profile (no stats for new users)
            return NextResponse.json({
              user: {
                id: newUser.id,
                email: newUser.email,
                is_pro: newUser.is_pro,
                monthly_shared: newUser.monthly_shared,
                max_file_size: newUser.max_file_size,
                max_monthly_quota: newUser.max_monthly_quota,
                quota_reset_date: newUser.quota_reset_date,
                created_at: newUser.created_at,
              },
              subscription: null,
              stats: {
                total_transfers: 0,
                successful_transfers: 0,
                total_bytes_transferred: 0,
                success_rate: 0,
              },
            });
          }
        } catch (createErr) {
          console.error('Error in auto-create flow:', createErr);
        }
      }
      
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