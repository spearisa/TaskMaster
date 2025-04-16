import Stripe from 'stripe';

// Make sure we have the Stripe secret key in environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing required environment variable: STRIPE_SECRET_KEY');
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for a task bid
 */
export async function createPaymentIntent(amount: number, metadata: Record<string, string>) {
  try {
    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);
    
    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata,
      payment_method_types: ['card'],
      description: `Payment for Task: ${metadata.taskTitle || 'Task Completion'}`,
    });
    
    return paymentIntent;
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
    console.error('Error confirming payment completion:', error);
    return false;
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
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * Create a Stripe Connect account to allow users to receive payments
 */
export async function createConnectAccount(email: string) {
  try {
    return await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw error;
  }
}

/**
 * Transfer funds to a task winner after completion
 */
export async function transferFundsToTaskWinner(amount: number, destinationAccountId: string, metadata: Record<string, string>) {
  try {
    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);
    
    // Create the transfer
    return await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: destinationAccountId,
      metadata,
    });
  } catch (error) {
    console.error('Error transferring funds:', error);
    throw error;
  }
}