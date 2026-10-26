import { Link } from 'react-router';
import { Mail } from 'lucide-react';
const BG = "https://images.unsplash.com/photo-1731589802397-6a1088d63630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

export function Landing() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Full-bleed photo */}
      <div className="absolute inset-0" style={{ backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/92" />

      <div className="absolute inset-0 flex flex-col justify-between px-5 pt-12 pb-10">

        {/* TOP: Masthead */}
        <div>
          <h1
            className="text-[#F7F3EE] tracking-tighter select-none -ml-1"
            style={{ fontSize: 'clamp(5.5rem, 24vw, 10rem)', fontWeight: 900, lineHeight: 0.85 }}
          >
            LUKU
          </h1>
          <div className="flex items-center gap-3 mt-3 ml-1">
            <span className="w-6 h-px bg-[#F2B872]" />
            <p className="text-[#F2B872] text-[10px] font-black uppercase tracking-[0.3em]">
              Stylist · Wardrobe · Shop
            </p>
          </div>
        </div>

        {/* BOTTOM: Auth */}
        <div className="space-y-5">
          <p className="text-[#F7F3EE]/65 text-sm font-semibold leading-snug max-w-[270px]">
            AI styling from your own wardrobe — then shop what completes the look.
          </p>

          {/* Social icon buttons + Join CTA */}
          <div className="flex items-center gap-3">
            {/* Google */}
            <button className="w-14 h-14 rounded-2xl bg-white/8 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#F7F3EE" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#F7F3EE" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#F7F3EE" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#F7F3EE" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            {/* Apple */}
            <button className="w-14 h-14 rounded-2xl backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#F7F3EE">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </button>

            {/* Email */}
            <Link
              to="/sign-in"
              className="w-14 h-14 rounded-2xl backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <Mail className="w-5 h-5 text-[#F7F3EE]" strokeWidth={2} />
            </Link>

            <div className="w-px h-9 bg-white/15" />

            {/* Join Free — green CTA for AI brand signal */}
            <Link
              to="/sign-up"
              className="flex-1 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #48CD8A 0%, #3AB87A 100%)' }}
            >
              <span className="text-black text-xs font-black uppercase tracking-[0.15em]">
                Join Free
              </span>
            </Link>
          </div>

          {/* Terms */}
          <p className="text-[#F7F3EE]/28 text-[10px] font-semibold">
            Continuing means you accept our{' '}
            <Link to="/help" className="text-[#F7F3EE]/45 underline underline-offset-2">Terms</Link>
            {' & '}
            <Link to="/help" className="text-[#F7F3EE]/45 underline underline-offset-2">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
