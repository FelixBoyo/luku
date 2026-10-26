import { Link, useLocation } from 'react-router';
import { Home, Compass, Plus, Sparkles, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/5 z-20">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2">
        {/* Home */}
        <Link to="/" className="flex-1">
          <button
            className={`
              w-full flex flex-col items-center gap-1 py-2 transition-all
              ${isActive('/') ? 'text-[#48CD8A]' : 'text-white/50 hover:text-white/70'}
            `}
          >
            <Home
              className={`w-5 h-5 ${isActive('/') ? 'fill-[#48CD8A]' : ''}`}
              strokeWidth={2.5}
            />
            <span className="text-[9px] font-black uppercase tracking-wide">Home</span>
          </button>
        </Link>

        {/* Discover */}
        <Link to="/discover" className="flex-1">
          <button
            className={`
              w-full flex flex-col items-center gap-1 py-2 transition-all
              ${isActive('/discover') ? 'text-[#48CD8A]' : 'text-white/50 hover:text-white/70'}
            `}
          >
            <Compass
              className={`w-5 h-5 ${isActive('/discover') ? 'fill-[#48CD8A]' : ''}`}
              strokeWidth={2.5}
            />
            <span className="text-[9px] font-black uppercase tracking-wide">Discover</span>
          </button>
        </Link>

        {/* Sell (Central Action) */}
        <Link to="/sell" className="flex-1">
          <button className="w-full flex flex-col items-center gap-1 py-1">
            <div className="w-12 h-12 bg-[#48CD8A] rounded-full flex items-center justify-center shadow-lg hover:bg-[#3AB87A] transition-colors -mt-4 border-4 border-black">
              <Plus className="w-6 h-6 text-black" strokeWidth={3} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wide text-white/50 mt-1">
              Sell
            </span>
          </button>
        </Link>

        {/* Coming Soon - Future Stylist Feature */}
        <Link to="/stylist" className="flex-1">
          <button
            className={`
              w-full flex flex-col items-center gap-1 py-2 transition-all
              ${isActive('/stylist') ? 'text-[#48CD8A]' : 'text-white/50 hover:text-white/70'}
            `}
          >
            <Sparkles
              className={`w-5 h-5 ${isActive('/stylist') ? 'fill-[#48CD8A]' : ''}`}
              strokeWidth={2.5}
            />
            <span className="text-[9px] font-black uppercase tracking-wide">Stylist</span>
          </button>
        </Link>

        {/* Me */}
        <Link to="/me" className="flex-1">
          <button
            className={`
              w-full flex flex-col items-center gap-1 py-2 transition-all
              ${isActive('/me') ? 'text-[#48CD8A]' : 'text-white/50 hover:text-white/70'}
            `}
          >
            <User
              className={`w-5 h-5 ${isActive('/me') ? 'fill-[#48CD8A]' : ''}`}
              strokeWidth={2.5}
            />
            <span className="text-[9px] font-black uppercase tracking-wide">Me</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}