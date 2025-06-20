import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id);
  
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  // Subscription will be handled by customer.subscription.created event
  console.log('Checkout session completed for user:', userId);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const userId = customer.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in customer metadata');
    return;
  }

  // Create subscription record
  const { error: subError } = await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
  });

  if (subError) {
    console.error('Error creating subscription record:', subError);
    return;
  }

  // Update user to Pro status
  const { error: userError } = await supabase.rpc('update_pro_limits', {
    user_uuid: userId,
  });

  if (userError) {
    console.error('Error updating user Pro status:', userError);
  } else {
    console.log('User upgraded to Pro:', userId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  // Update subscription record
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  // If subscription is canceled or past_due, downgrade user
  if (subscription.status === 'canceled' || subscription.status === 'past_due') {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subData) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_pro: false,
          max_file_size: 100 * 1024 * 1024, // 100MB
          max_monthly_quota: 10 * 1024 * 1024 * 1024, // 10GB
          updated_at: new Date().toISOString(),
        })
        .eq('id', subData.user_id);

      if (userError) {
        console.error('Error downgrading user:', userError);
      } else {
        console.log('User downgraded from Pro:', subData.user_id);
      }
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  // Mark subscription as canceled
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error marking subscription as canceled:', error);
  }

  // Downgrade user
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subData) {
    const { error: userError } = await supabase
      .from('users')
      .update({
        is_pro: false,
        max_file_size: 100 * 1024 * 1024, // 100MB
        max_monthly_quota: 10 * 1024 * 1024 * 1024, // 10GB
        updated_at: new Date().toISOString(),
      })
      .eq('id', subData.user_id);

    if (userError) {
      console.error('Error downgrading user:', userError);
    } else {
      console.log('User downgraded from Pro:', subData.user_id);
    }
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing payment succeeded:', invoice.id);
  // Could implement usage tracking or notifications here
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing payment failed:', invoice.id);
  // Could implement retry logic or notifications here
} 