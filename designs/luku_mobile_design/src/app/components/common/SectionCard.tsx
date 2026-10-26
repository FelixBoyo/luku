import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

type SectionCardProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  headerCTA?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'elevated' | 'muted' | 'gradient';
  density?: 'comfortable' | 'compact';
  state?: 'default' | 'loading' | 'empty' | 'error' | 'locked';
  emptyMessage?: string;
  errorMessage?: string;
  lockedMessage?: string;
  collapsible?: boolean;
  className?: string;
};

export function SectionCard({
  title,
  subtitle,
  badge,
  headerCTA,
  children,
  footer,
  variant = 'default',
  density = 'comfortable',
  state = 'default',
  emptyMessage = 'No data available',
  errorMessage = 'Something went wrong',
  lockedMessage = 'Upgrade to access this feature',
  collapsible = false,
  className = '',
}: SectionCardProps) {
  const padding = density === 'comfortable' ? 'p-6' : 'p-4';

  const variantClasses = {
    default: 'bg-white/5 backdrop-blur-xl border border-white/10',
    elevated: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl',
    muted: 'bg-white/[0.03] backdrop-blur-xl border border-white/5',
    gradient: 'bg-gradient-to-br from-[#F2B872]/10 via-white/5 to-[#D98C4A]/10 backdrop-blur-xl border border-white/10',
  };

  // Loading Skeleton
  if (state === 'loading') {
    return (
      <div className={`${variantClasses[variant]} rounded-2xl ${padding} ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (state === 'empty') {
    return (
      <div className={`${variantClasses[variant]} rounded-2xl ${padding} ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white text-lg font-black uppercase tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-white/60 text-sm font-semibold mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-white/60 text-sm font-semibold">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Error State
  if (state === 'error') {
    return (
      <div className={`${variantClasses[variant]} rounded-2xl ${padding} ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-white text-lg font-black uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 text-sm font-semibold">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Locked State (Pro/Role-gated)
  if (state === 'locked') {
    return (
      <div className={`${variantClasses['muted']} rounded-2xl ${padding} ${className} relative overflow-hidden`}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-white text-lg font-black uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="inline-block mb-3 px-4 py-2 bg-[#48CD8A] rounded-lg">
            <p className="text-black text-xs font-black uppercase tracking-wider">
              PRO
            </p>
          </div>
          <p className="text-white/70 text-sm font-semibold">{lockedMessage}</p>
        </div>
      </div>
    );
  }

  // Default State
  return (
    <div className={`${variantClasses[variant]} rounded-2xl ${padding} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-white text-lg font-black uppercase tracking-wide">
              {title}
            </h3>
            {badge && (
              <span className="px-2 py-1 bg-[#48CD8A] text-black text-xs font-black uppercase rounded">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-white/60 text-sm font-semibold mt-1">{subtitle}</p>
          )}
        </div>

        {headerCTA && (
          <button
            onClick={headerCTA.onClick}
            className="flex items-center gap-1 text-white hover:text-[#48CD8A] transition-colors text-sm font-black uppercase tracking-wide"
          >
            {headerCTA.icon}
            <span>{headerCTA.label}</span>
            <ChevronRight className="w-4 h-4" strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Body */}
      <div>{children}</div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {footer}
        </div>
      )}
    </div>
  );
}