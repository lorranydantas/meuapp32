import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import Link from 'next/link';
import { PricingLines } from '@/components/pricing-lines';
import { PricingPageClient } from './pricing-page';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const products = await getStripeProducts();

  return (
    <PricingPageClient products={products} />
  );
}
