import Link from 'next/link';

type GradientButtonProps = {
  label: string;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

export default function GradientButton({
  label,
  href,
  type = 'button',
  disabled = false,
  className = '',
  onClick,
}: GradientButtonProps) {
  const classes = `btn-gradient ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} onClick={onClick}>
      {label}
    </button>
  );
}
