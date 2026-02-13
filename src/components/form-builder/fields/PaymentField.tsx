'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import type { FormField } from '@/types/form'

interface PaymentFieldProps {
  field: FormField
  value?: any
  onChange?: (value: any) => void
  error?: string
  disabled?: boolean
}

// Initialize Stripe (lazy loading)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null)

export function PaymentField({ field, onChange, error: externalError, disabled }: PaymentFieldProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const amount = field.amount || 0
  const currency = field.currency || 'usd'
  const paymentType = field.paymentType || 'fixed'
  const billingInterval = field.billingInterval || 'month'

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const handlePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setLoading(true)
    setError(null)
    setPaymentStatus('processing')

    try {
      // Create payment intent or checkout session
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          paymentType,
          billingInterval: paymentType === 'subscription' ? billingInterval : undefined,
          formId: field.id,
          metadata: {
            fieldName: field.label,
          },
        }),
      })

      const paymentData = await response.json()

      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Payment initialization failed')
      }

      if (paymentData.type === 'checkout') {
        // Redirect to Stripe Checkout
        window.location.href = paymentData.url
      } else if (paymentData.type === 'payment_intent') {
        // Use Payment Element
        const stripe = await stripePromise
        if (!stripe) throw new Error('Stripe failed to load')

        const { error } = await stripe.confirmPayment({
          clientSecret: paymentData.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/payment/confirm`,
          },
        })

        if (error) {
          throw new Error(error.message)
        }

        setPaymentStatus('success')
        onChange?.({ status: 'paid', paymentIntentId: paymentData.clientSecret })
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
      setPaymentStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (paymentStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-8 px-4 bg-green-500/10 border border-green-500/30 rounded-xl"
      >
        <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
        <p className="text-sm text-white/60 text-center">
          Thank you for your payment. Your transaction has been processed successfully.
        </p>
      </motion.div>
    )
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      {/* Payment Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">{field.label}</label>
            <div className="flex items-center gap-2 mt-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">
                {paymentType === 'variable' ? 'Pay what you want' : formatCurrency(amount, currency)}
              </span>
            </div>
            {field.required && <span className="text-red-400 text-sm">*</span>}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Lock className="w-3 h-3" />
              Secure payment
            </div>
            <div className="text-xs text-white/40 mt-1">Powered by Stripe</div>
          </div>
        </div>

        {/* Payment Type Details */}
        {paymentType === 'subscription' && (
          <div className="text-sm text-white/60 mt-2">
            Billed {billingInterval}ly • Cancel anytime
          </div>
        )}
      </div>

      {/* Payment Form */}
      {paymentType === 'fixed' ? (
        <button
          onClick={handlePayment}
          disabled={loading || disabled}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay {formatCurrency(amount, currency)}
            </>
          )}
        </button>
      ) : (
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Amount ({currency.toUpperCase()})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                {currency.toUpperCase()}
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value)) {
                    onChange?.({ amount: value })
                  }
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || disabled}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Continue to Payment
              </>
            )}
          </button>
        </form>
      )}

      {/* Error Display */}
      {(error || externalError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{error || externalError}</span>
        </motion.div>
      )}

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40 mt-2">{field.helpText}</p>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-xs text-white/40 mt-4">
        <Lock className="w-3 h-3" />
        <span>Your payment information is encrypted and secure. We never store your card details.</span>
      </div>
    </div>
  )
}