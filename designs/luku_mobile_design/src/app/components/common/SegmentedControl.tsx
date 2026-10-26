import { ReactNode } from 'react';

type SegmentedControlProps = {
  segments: Array<{
    label: string;
    value: string;
    icon?: ReactNode;
    badge?: string | number;
  }>;
  activeSegment: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'compact';
  fullWidth?: boolean;
  className?: string;
};

export function SegmentedControl({
  segments,
  activeSegment,
  onChange,
  variant = 'default',
  fullWidth = false,
  className = '',
}: SegmentedControlProps) {
  const isCompact = variant === 'compact';
  const padding = isCompact ? 'px-4 py-2' : 'px-5 py-3';
  const fontSize = isCompact ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`inline-flex gap-1 bg-[#F5F5F5] rounded-xl p-1 border-2 border-black/20 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {segments.map((segment) => {
        const isActive = activeSegment === segment.value;
        return (
          <button
            key={segment.value}
            onClick={() => onChange(segment.value)}
            className={`${padding} ${fontSize} font-black uppercase tracking-wide rounded-lg transition-all ${
              fullWidth ? 'flex-1' : ''
            } ${
              isActive
                ? 'bg-white text-black border-2 border-black/30 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md'
                : 'bg-transparent text-black/60 hover:text-black hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {segment.icon && (
                <span className={isActive ? 'text-[#48CD8A]' : ''}>
                  {segment.icon}
                </span>
              )}
              <span>{segment.label}</span>
              {segment.badge !== undefined && (
                <span
                  className={`${
                    isCompact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
                  } rounded-full font-black ${
                    isActive
                      ? 'bg-[#48CD8A] text-black'
                      : 'bg-black/20 text-black/70'
                  }`}
                >
                  {segment.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
