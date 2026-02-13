import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Helper function to get Stripe client lazily
function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
  })
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient()
  try {
    const { amount, currency = 'usd', paymentType, formId, customerEmail, metadata } = await request.json()

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    let paymentIntent: Stripe.PaymentIntent

    switch (paymentType) {
      case 'fixed':
        // One-time payment
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            formId,
            ...metadata,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        })
        break

      case 'subscription':
        // Recurring payment
        const product = await stripe.products.create({
          name: metadata?.productName || 'Subscription',
          metadata: {
            formId,
          },
        })

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(amount * 100),
          currency,
          recurring: {
            interval: metadata?.billingInterval || 'month',
          },
        })

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
          customer_email: customerEmail,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
          metadata: {
            formId,
            ...metadata,
          },
        })

        return NextResponse.json({
          success: true,
          sessionId: session.id,
          url: session.url,
          type: 'checkout',
        })

      default:
        return NextResponse.json(
          { error: 'Invalid payment type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      type: 'payment_intent',
    })

  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment failed' },
      { status: 500 }
    )
  }
}

// Webhook handler for Stripe events
export async function PUT(request: NextRequest) {
  // Lazy initialize Stripe client
  const stripe = getStripeClient()

  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update form submission status, send notifications, etc.
        await handlePaymentSuccess(paymentIntent)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent

        // Handle failed payment
        await handlePaymentFailure(failedPayment)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice

        // Handle successful subscription payment
        await handleSubscriptionPayment(invoice)
        break

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription

        // Handle subscription cancellation
        await handleSubscriptionCancellation(subscription)
        break

      default:
        // Silently handle unhandled event types
        break
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  // Lazy initialize Stripe client
  const stripe = getStripeClient()

  const { searchParams } = new URL(request.url)
  const paymentIntentId = searchParams.get('payment_intent_id')

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: 'Payment intent ID is required' },
      { status: 400 }
    )
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created,
    })

  } catch (error: any) {
    console.error('Failed to retrieve payment intent:', error)
    return NextResponse.json(
      { error: 'Payment intent not found' },
      { status: 404 }
    )
  }
}

// Refund a payment
export async function DELETE(request: NextRequest) {
  // Lazy initialize Stripe client
  const stripe = getStripeClient()

  try {
    const { paymentIntentId, reason, amount } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
      amount: amount ? Math.round(amount * 100) : undefined,
    })

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    })

  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: error.message || 'Refund failed' },
      { status: 500 }
    )
  }
}

// Helper functions
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Update your database, send confirmation email, etc.

  // Example: Update form submission status
  // await updateSubmissionStatus(paymentIntent.metadata.formId, 'paid', paymentIntent.id)
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  // Log failed payment, notify user, etc.
  // Consider logging to a monitoring service in production
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  // Update subscription status, send receipt, etc.
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  // Handle subscription cancellation
}