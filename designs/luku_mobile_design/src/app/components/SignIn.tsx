import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

const BG = "https://images.unsplash.com/photo-1621804174943-fc6d0f06ef1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Full-bleed photo */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/95" />

      {/* Back */}
      <Link
        to="/landing"
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
        <p className="text-[#48CD8A] text-[10px] font-black uppercase tracking-[0.35em] mb-1">
          Welcome back
        </p>
        <h2 className="text-[#F7F3EE] text-2xl font-black tracking-tight mb-6">
          Sign in to continue
        </h2>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-3.5 rounded-xl border border-white/10 text-[#F7F3EE] placeholder-white/30 text-sm font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-white/10 text-[#F7F3EE] placeholder-white/30 text-sm font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword
                ? <EyeOff className="w-4 h-4 text-white/30" strokeWidth={2} />
                : <Eye className="w-4 h-4 text-white/30" strokeWidth={2} />
              }
            </button>
          </div>

          <div className="flex justify-end">
            <Link to="/password-reset" className="text-[#48CD8A] text-xs font-bold">
              Forgot password?
            </Link>
          </div>

          <Link to="/">
            <button className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] text-black transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #48CD8A 0%, #3AB87A 100%)' }}>
              Sign In
            </button>
          </Link>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/25 text-[10px] font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 py-3.5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#F7F3EE" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#F7F3EE" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#F7F3EE" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#F7F3EE" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button
              className="flex-1 py-3.5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#F7F3EE">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </button>
          </div>
        </div>

        <p className="text-center text-white/35 text-xs font-semibold mt-6">
          No account?{' '}
          <Link to="/sign-up" className="text-[#D98C4A] font-bold">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
