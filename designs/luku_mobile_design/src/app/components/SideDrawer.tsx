import { X, Shirt, Grid3x3, Sparkles, Users, Settings, HelpCircle, ShoppingBag, Package, Store, BarChart3 } from 'lucide-react';
import { Link } from 'react-router';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 bg-black border-r border-white/10 z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Header */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#48CD8A]/20 via-[#3AB87A]/10 to-black"></div>
          <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between">
            <h2 className="text-white text-4xl font-black tracking-tighter">LUKU</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
          </div>
          <div className="absolute bottom-6 left-6">
            <p className="text-white/70 text-sm font-semibold">Explore LUKU</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-6 space-y-6">
          {/* Browse Section */}
          <div>
            <h3 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
              Browse
            </h3>
            <div className="space-y-1">
              <NavItem to="/wardrobe" icon={Shirt} label="Wardrobe" onClick={onClose} />
              <NavItem to="/mood-boards" icon={Grid3x3} label="Mood Boards" onClick={onClose} />
              <NavItem to="/ai-recommendations" icon={Sparkles} label="AI Stylist" onClick={onClose} />
              <NavItem to="/community" icon={Users} label="Community" onClick={onClose} />
            </div>
          </div>

          {/* Shopping Section */}
          <div>
            <h3 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
              Shopping
            </h3>
            <div className="space-y-1">
              <NavItem to="/marketplace" icon={Store} label="Marketplace" onClick={onClose} />
              <NavItem to="/cart" icon={ShoppingBag} label="Shopping Cart" onClick={onClose} />
              <NavItem to="/orders" icon={Package} label="Orders" onClick={onClose} />
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
              Account
            </h3>
            <div className="space-y-1">
              <NavItem to="/insights" icon={BarChart3} label="Insights" onClick={onClose} />
              <NavItem to="/profile" icon={Settings} label="Settings" onClick={onClose} />
              <NavItem to="/help" icon={HelpCircle} label="Help & Support" onClick={onClose} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <p className="text-white/40 text-xs font-semibold text-center">
            Version 1.0.0
          </p>
        </div>
      </div>
    </>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}

function NavItem({ to, icon: Icon, label, onClick }: NavItemProps) {
  return (
    <Link to={to} onClick={onClick}>
      <button className="w-full flex items-center gap-4 p-3 hover:bg-white/10 rounded-lg transition-colors group">
        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-[#48CD8A]/20 transition-colors">
          <Icon className="w-5 h-5 text-white group-hover:text-[#48CD8A]" strokeWidth={2.5} />
        </div>
        <span className="text-white text-sm font-bold group-hover:text-[#48CD8A] transition-colors">
          {label}
        </span>
      </button>
    </Link>
  );
}
