import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe client instance
 * Singleton pattern to avoid multiple initializations
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables',
      );
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

/**
 * Format amount for display (VND)
 * @param amount - Amount in smallest currency unit (cents for USD, whole number for VND)
 * @param currency - Currency code (default: vnd)
 */
export const formatAmount = (
  amount: number,
  currency: string = 'vnd',
): string => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  });

  return formatter.format(amount);
};

/**
 * Convert VND amount to smallest currency unit for Stripe
 * VND doesn't use decimals, so no conversion needed
 * @param amount - Amount in VND
 */
export const convertToStripeAmount = (amount: number): number => {
  return Math.round(amount);
};
