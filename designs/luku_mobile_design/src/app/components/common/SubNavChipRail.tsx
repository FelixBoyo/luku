import { ReactNode } from 'react';

type ChipProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  count?: number;
};

type SubNavChipRailProps = {
  chips: ChipProps[];
  activeChip: string;
  onChange: (value: string) => void;
  sticky?: boolean;
  className?: string;
};

export function SubNavChipRail({
  chips,
  activeChip,
  onChange,
  sticky = true,
  className = '',
}: SubNavChipRailProps) {
  return (
    <div
      className={`${sticky ? 'sticky top-0 z-10 bg-[#FAFAFA] py-3 -mx-6 px-6' : ''} ${className}`}
    >
      <div
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {chips.map((chip) => {
          const isActive = activeChip === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onChange(chip.value)}
              className={`px-4 py-2.5 rounded-lg font-black text-sm uppercase tracking-wide whitespace-nowrap transition-all shadow-md flex items-center gap-2 ${
                isActive
                  ? 'bg-black text-white border-2 border-black/30'
                  : 'bg-white text-black border-2 border-black/30 hover:bg-[#FAFAFA]'
              }`}
            >
              {chip.icon && (
                <span className={isActive ? 'text-[#48CD8A]' : 'text-black/60'}>
                  {chip.icon}
                </span>
              )}
              <span>{chip.label}</span>
              {chip.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    isActive
                      ? 'bg-[#48CD8A] text-black'
                      : 'bg-black/20 text-black/70'
                  }`}
                >
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
