'use client';

import { useState } from 'react';
import GradientButton from './GradientButton';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'submitting') return;
    setStatus('submitting');

    // TODO: wire to real waitlist endpoint when available.
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <p className="text-sm font-medium text-moss">
        You&apos;re on the list. We&apos;ll email you when LUKU opens.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md relative z-10">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'submitting'}
        className="flex-1 rounded-luku-lg border border-mistFaint bg-[rgba(255,255,255,0.06)] px-5 py-3 text-sm text-cream placeholder:text-mist/50 focus:border-moss focus:outline-none focus:shadow-[0_0_20px_rgba(72,205,138,0.15)] transition-all duration-300 disabled:opacity-50"
      />
      <GradientButton
        type="submit"
        label={status === 'submitting' ? 'Joining…' : 'Join waitlist'}
        disabled={status === 'submitting'}
        className="shrink-0 px-6"
      />
      {status === 'error' ? (
        <p className="text-xs text-red-400 sm:absolute sm:mt-14">Something went wrong. Try again.</p>
      ) : null}
    </form>
  );
}
