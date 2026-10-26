import { useState } from 'react';
import { Sparkles, Bell } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


export function ComingSoon() {
  const [notifyMe, setNotifyMe] = useState(false);

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-6">
        {/* Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-[#48CD8A]/20 to-[#3AB87A]/20 border-2 border-[#48CD8A]/40 rounded-full flex items-center justify-center mb-8">
          <Sparkles className="w-16 h-16 text-[#48CD8A]" strokeWidth={2} />
        </div>

        {/* Title */}
        <h1 className="text-white text-5xl font-black tracking-tighter leading-none mb-4 text-center">
          COMING SOON
        </h1>

        {/* Description */}
        <p className="text-white/70 text-base font-semibold text-center max-w-sm mb-8 leading-relaxed">
          We're working on something special. This feature will be available in a future update.
        </p>

        {/* Notify Button */}
        {!notifyMe ? (
          <button
            onClick={() => setNotifyMe(true)}
            className="px-8 py-4 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-black font-black text-sm rounded-xl hover:opacity-90 transition-opacity uppercase tracking-wide flex items-center gap-2"
          >
            <Bell className="w-5 h-5" strokeWidth={2.5} />
            Notify Me
          </button>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
            <p className="text-[#48CD8A] text-sm font-bold text-center">
              We'll let you know when it's ready!
            </p>
          </div>
        )}

        {/* Back Link */}
        <Link to="/">
          <button className="mt-8 text-white/60 text-sm font-bold hover:text-white transition-colors uppercase tracking-wide">
            Return Home
          </button>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
