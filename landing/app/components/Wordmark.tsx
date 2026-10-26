type WordmarkVariant = 'nav' | 'hero';

type WordmarkProps = {
  variant?: WordmarkVariant;
  className?: string;
};

const variantStyles: Record<WordmarkVariant, string> = {
  nav: 'text-[28px] tracking-[-0.035em] text-white',
  hero: 'text-[clamp(3rem,8vw,6rem)] tracking-[-0.04em] text-cream',
};

export default function Wordmark({ variant = 'nav', className = '' }: WordmarkProps) {
  return (
    <span
      className={`font-black select-none ${variantStyles[variant]} ${className}`.trim()}
      aria-label="LUKU"
    >
      LUKU
    </span>
  );
}

export function TaglineRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span className="h-px w-6 bg-warm shrink-0" aria-hidden="true" />
      <span className="text-micro-warm">Stylist · Wardrobe · Shop</span>
    </div>
  );
}
