import { Hono } from 'hono';
import Stripe from 'stripe';
import { supabase, type UserRow } from '../db.js';
import { requireAuth } from '../auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

export const billingRoute = new Hono<{ Variables: { user: UserRow } }>();

billingRoute.post('/checkout', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ projectId?: string }>().catch(() => ({ projectId: undefined }));

  const appUrl = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  const base = body.projectId ? `/embed?id=${body.projectId}` : '/embed';
  const successUrl = `${appUrl}${base}&checkout=success`;
  const cancelUrl = `${appUrl}${base}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: user.id },
  });

  return c.json({ url: session.url });
});

billingRoute.post('/portal', requireAuth, async (c) => {
  const user = c.get('user');
  const appUrl = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '');

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    customerId = customers.data[0]?.id ?? null;
  }

  if (!customerId) {
    return c.json({ error: 'no_customer' }, 404);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/embed`,
  });

  return c.json({ url: session.url });
});

billingRoute.post('/webhook', async (c) => {
  const sig = c.req.header('stripe-signature') ?? '';
  const body = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '');
  } catch {
    return c.json({ error: 'invalid_signature' }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const customerId = session.customer as string | null;
    if (userId) {
      await supabase.from('users').update({
        subscription_status: 'active',
        ...(customerId ? { stripe_customer_id: customerId } : {}),
      }).eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && customer.email) {
      await supabase.from('users').update({ subscription_status: 'inactive' }).eq('email', customer.email);
    }
  }

  return c.json({ ok: true });
});
