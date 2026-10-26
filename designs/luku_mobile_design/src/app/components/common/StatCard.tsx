import { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  variant?: 'default' | 'highlight' | 'muted';
  size?: 'default' | 'compact';
  className?: string;
};

export function StatCard({
  label,
  value,
  change,
  trend = 'neutral',
  icon,
  variant = 'default',
  size = 'default',
  className = '',
}: StatCardProps) {
  const isCompact = size === 'compact';
  const padding = isCompact ? 'p-3' : 'p-5';
  const valueSize = isCompact ? 'text-2xl' : 'text-3xl';
  const labelSize = isCompact ? 'text-[10px]' : 'text-xs';

  const variantClasses = {
    default: 'bg-white border-2 border-black/30 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md',
    highlight: 'bg-[#48CD8A] border-2 border-black/30 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md',
    muted: 'bg-[#F5F5F5] border-2 border-black/20 shadow-sm',
  };

  const trendColors = {
    up: 'text-[#48CD8A]',
    down: 'text-red-600',
    neutral: 'text-black/70',
  };

  return (
    <div className={`${variantClasses[variant]} rounded-xl ${padding} ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`text-black/70 ${labelSize} font-black uppercase tracking-wider`}>
          {label}
        </p>
        {icon && (
          <div className="text-black/60">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <p className={`text-black ${valueSize} font-black leading-none`}>
          {value}
        </p>
        {change && (
          <p className={`${trendColors[trend]} text-sm font-black leading-none mb-1`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}

type KPIRowProps = {
  items: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
  className?: string;
};

export function KPIRow({ items, className = '' }: KPIRowProps) {
  return (
    <div className={`grid gap-3 ${className}`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`rounded-xl p-4 ${
            item.highlight
              ? 'bg-[#48CD8A] border-2 border-black/30 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md'
              : 'bg-white border-2 border-black/30 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md'
          }`}
        >
          <p className="text-black/70 text-xs font-black uppercase tracking-wider mb-1">
            {item.label}
          </p>
          <p className="text-black text-2xl font-black">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
