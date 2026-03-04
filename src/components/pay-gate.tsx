'use client';

import { useState, useEffect } from 'react';
import { analytics } from '@/lib/analytics';

const RECEIPT_KEY = 'payment_receipt';

interface PayGateProps {
  /** Content shown to users who have paid */
  children: React.ReactNode;
  /** What the user gets — shown on the gate */
  valueProposition: string;
  /** Price display string, e.g. "$9" */
  price: string;
  /**
   * Stripe Payment Link URL (recommended — no server code needed).
   * Create one at stripe.com → Payment Links. Set the success_url to your
   * tool page with ?paid=true appended (e.g. https://modrynstudio.com/tools/my-tool?paid=true).
   *
   * When omitted, falls back to POST /api/checkout (Checkout Sessions —
   * requires `stripe` npm package + STRIPE_SECRET_KEY + STRIPE_PRICE_ID env vars).
   */
  checkoutUrl?: string;
  /**
   * Optional metadata passed as JSON body to POST /api/checkout.
   * Use to carry plan data (activity, city, comfort_level, plan_id) through to
   * Stripe session metadata → /confirm page.
   * Only used when checkoutUrl is not set (Checkout Sessions mode).
   */
  checkoutBody?: Record<string, unknown>;
}

/**
 * Local-first pay gate.
 * Checks localStorage for a payment receipt. If found, renders children.
 * If not, shows a gate with a payment button.
 *
 * Two modes:
 * 1. Payment Links (default) — pass a `checkoutUrl` prop. No server code needed.
 * 2. Checkout Sessions — omit `checkoutUrl`. Requires /api/checkout route + env vars.
 *
 * After Stripe redirects back with ?paid=true, stores the receipt
 * in localStorage and reveals the content. No accounts, no database.
 */
export default function PayGate({ children, valueProposition, price, checkoutUrl, checkoutBody }: PayGateProps) {
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check localStorage for existing receipt
    const receipt = localStorage.getItem(RECEIPT_KEY);
    if (receipt) {
      setHasPaid(true);
      setChecking(false);
      return;
    }

    // Check URL params for return from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      localStorage.setItem(RECEIPT_KEY, new Date().toISOString());
      setHasPaid(true);
      analytics.track('payment_gate', { action: 'payment_completed' });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    setChecking(false);
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    analytics.track('payment_gate', { action: 'checkout_click' });

    // Payment Links mode — navigate directly to the Stripe-hosted link
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    // Checkout Sessions mode — POST to /api/checkout for a session URL
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: checkoutBody ? JSON.stringify(checkoutBody) : undefined,
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  if (checking) return null;
  if (hasPaid) return <>{children}</>;

  return (
    <div className="border-border mx-auto max-w-md border-2 p-8 text-center">
      <h3 className="font-heading text-xl font-semibold">{valueProposition}</h3>
      <p className="text-muted mt-4 font-mono text-sm">
        One-time payment. No account required. Works instantly.
      </p>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-accent mt-6 h-12 w-full px-8 font-mono text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Redirecting...' : `Pay ${price}`}
      </button>
    </div>
  );
}
