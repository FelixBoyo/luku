import { useState, useEffect } from 'react';
import { ShoppingCart, Mail } from 'lucide-react';
import { Link } from 'react-router';

interface TopNavProps {
  cartItemCount?: number;
  inboxUnreadCount?: number;
}

export function TopNav({ cartItemCount = 0, inboxUnreadCount = 0 }: TopNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/90 backdrop-blur-lg py-3 shadow-lg'
          : 'bg-black/60 backdrop-blur-md py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Inbox */}
        <Link to="/inbox" className="relative">
          <button
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-lg"
            aria-label="Inbox"
          >
            <Mail className="w-6 h-6 text-white" strokeWidth={2.5} />
            {inboxUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#48CD8A] text-black text-xs font-black rounded-full flex items-center justify-center">
                {inboxUnreadCount}
              </span>
            )}
          </button>
        </Link>

        {/* Center: LUKU Logo */}
        <Link to="/" className="flex-1 flex justify-center">
          <h1
            className={`font-black tracking-tighter text-white transition-all ${
              isScrolled ? 'text-2xl' : 'text-3xl'
            }`}
          >
            LUKU
          </h1>
        </Link>

        {/* Right: Cart */}
        <Link to="/cart" className="relative">
          <button
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-lg"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="w-6 h-6 text-white" strokeWidth={2.5} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#48CD8A] text-black text-xs font-black rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </Link>
      </div>
    </nav>
  );
}
