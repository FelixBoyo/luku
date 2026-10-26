'use client';

import { useState, useRef } from 'react';

type GarmentTagProps = {
  className?: string;
  rotate?: number;
  label: string;
  value: string;
  sub: string;
  accent: 'warm' | 'moss' | 'cream';
  delay?: number;
};

const accentMap: Record<GarmentTagProps['accent'], string> = {
  warm: 'text-warm',
  moss: 'text-moss',
  cream: 'text-cream',
};

export default function GarmentTag({
  className = '',
  rotate = 0,
  label,
  value,
  sub,
  accent,
  delay = 0,
}: GarmentTagProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -12;
    const tiltY = (x / (rect.width / 2)) * 12;

    setTilt({ x: tiltX, y: tiltY, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

  const transformStyle = tilt.active
    ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.05, 1.05, 1.05)`
    : `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

  const shadowStyle = tilt.active
    ? `${-tilt.y * 1.5}px ${tilt.x * 1.5 + 25}px 45px -10px rgba(0, 0, 0, 0.75)`
    : `0 20px 40px -18px rgba(0,0,0,0.55)`;

  return (
    <div
      className={`tag-sway fade-up ${className}`}
      style={
        {
          '--rot': `${rotate}deg`,
          animationDelay: `${delay}s, ${delay}s`,
        } as React.CSSProperties
      }
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="card-dark relative cursor-pointer select-none px-5 py-4 backdrop-blur-sm"
        style={{
          transform: transformStyle,
          boxShadow: shadowStyle,
          transition: tilt.active
            ? 'transform 0.08s ease-out, box-shadow 0.08s ease-out'
            : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 h-4 w-4 rounded-full border border-mistFaint bg-shell" />
        <div className="pointer-events-none absolute left-1/2 -top-10 h-8 w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent to-white/10" />

        <p className="text-micro mt-2 text-mist">{label}</p>
        <p className={`mt-1 text-2xl font-black ${accentMap[accent]}`}>{value}</p>
        <p className="mt-1 text-[11px] text-mist">{sub}</p>
        <div className="absolute -bottom-px left-3 right-3 border-t border-dashed border-mistFaint" />
      </div>
    </div>
  );
}
