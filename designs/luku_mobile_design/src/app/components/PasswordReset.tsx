import { useState } from 'react';
import { ArrowLeft, Mail, Check } from 'lucide-react';
import { Link } from 'react-router';

const BG = "https://images.unsplash.com/photo-1580478491436-fd6a937acc9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

export function PasswordReset() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Full-bleed photo */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/95" />

      {/* Back */}
      <Link
        to="/sign-in"
        className="absolute top-12 left-5 z-10 w-10 h-10 rounded-xl border border-white/15 flex items-center justify-center backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <ArrowLeft className="w-5 h-5 text-[#F7F3EE]" strokeWidth={2.5} />
      </Link>

      {/* Wordmark */}
      <div className="absolute top-10 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <h1
          className="text-[#F7F3EE] tracking-tighter select-none"
          style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}
        >
          LUKU
        </h1>
      </div>

      {/* Bottom panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-10 pt-8"
        style={{ background: 'linear-gradient(to top, #130B04 88%, transparent)' }}
      >
        {!sent ? (
          <>
            <p className="text-[#48CD8A] text-[10px] font-black uppercase tracking-[0.35em] mb-1">
              Account recovery
            </p>
            <h2 className="text-[#F7F3EE] text-2xl font-black tracking-tight mb-2">
              Reset your password
            </h2>
            <p className="text-[#F7F3EE]/45 text-sm font-semibold mb-6">
              Enter your email and we'll send a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 text-[#F7F3EE] placeholder-white/30 text-sm font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] text-black transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #48CD8A 0%, #3AB87A 100%)' }}
              >
                Send Reset Link
              </button>
            </form>

            <p className="text-center text-white/35 text-xs font-semibold mt-6">
              Remember it?{' '}
              <Link to="/sign-in" className="text-[#D98C4A] font-bold">Back to sign in</Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-[#48CD8A] text-[10px] font-black uppercase tracking-[0.35em] mb-1">
              Check your inbox
            </p>
            <h2 className="text-[#F7F3EE] text-2xl font-black tracking-tight mb-2">
              Link on its way
            </h2>
            <p className="text-[#F7F3EE]/45 text-sm font-semibold mb-6">
              We sent a reset link to{' '}
              <span className="text-[#F2B872] font-bold">{email}</span>
              . Check spam if you don't see it.
            </p>

            {/* Success icon */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #48CD8A 0%, #3AB87A 100%)' }}
              >
                <Check className="w-5 h-5 text-black" strokeWidth={3} />
              </div>
              <p className="text-[#F7F3EE]/55 text-xs font-semibold">
                Link expires in 24 hours
              </p>
            </div>

            <div className="space-y-3">
              <Link to="/sign-in">
                <button
                  className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] text-black transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #48CD8A 0%, #3AB87A 100%)' }}
                >
                  Back to Sign In
                </button>
              </Link>
              <button
                onClick={() => setSent(false)}
                className="w-full py-3.5 rounded-xl border border-white/10 text-[#F7F3EE]/60 font-black text-sm uppercase tracking-[0.1em] hover:bg-white/5 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Resend Email
              </button>
            </div>

            <p className="text-center text-white/30 text-xs font-semibold mt-6">
              Need help?{' '}
              <Link to="/help" className="text-[#D98C4A] font-bold">Contact support</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
