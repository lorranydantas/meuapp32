import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { creditService } from './credit-service';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handleStripeWebhook(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  const subscription = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case 'invoice.paid':
      if ((event.data.object as Stripe.Invoice).billing_reason === 'subscription_cycle') {
        await creditService.grantCreditsForSubscription(subscription);
      }
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await creditService.grantCreditsForSubscription(subscription, 'subscription_update');
      break;
    case 'customer.subscription.deleted':
      await creditService.resetCreditsForCanceledSubscription(subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
