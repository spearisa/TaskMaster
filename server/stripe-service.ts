import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for a task bid
 */
export async function createPaymentIntent(amount: number, metadata: Record<string, string>) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata,
    });
    
    return { 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
}

/**
 * Confirm that a payment has been completed
 */
export async function confirmPaymentComplete(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    console.error('Error confirming payment status:', error);
    throw error;
  }
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(email: string, name?: string) {
  try {
    return await stripe.customers.create({
      email,
      name,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

/**
 * Create a Stripe Connect account to allow users to receive payments
 */
export async function createConnectAccount(email: string) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: {requested: true},
        transfers: {requested: true},
      },
    });
    return account;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
}

/**
 * Transfer funds to a task winner after completion
 */
export async function transferFundsToTaskWinner(amount: number, destinationAccountId: string, metadata: Record<string, string>) {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: destinationAccountId,
      metadata,
    });
    return transfer;
  } catch (error) {
    console.error('Error transferring funds:', error);
    throw error;
  }
}