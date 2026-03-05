'use client';

// Global error boundary — catches unhandled errors in the route tree.
// Next.js requires this to be a Client Component.

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting in production
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-heading text-xl font-bold">Something went wrong.</p>
      <p className="text-muted mt-3 text-sm">
        An unexpected error occurred. Try again or start over.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="bg-accent px-6 py-3 font-mono text-sm font-bold text-black hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border-border text-muted hover:text-text border px-6 py-3 font-mono text-sm"
        >
          Start over
        </Link>
      </div>
      {error.digest && (
        <p className="text-muted mt-6 font-mono text-xs">Error ID: {error.digest}</p>
      )}
    </main>
  );
}
