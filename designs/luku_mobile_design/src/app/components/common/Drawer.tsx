import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'right' | 'bottom';
  size?: 'default' | 'large';
  className?: string;
};

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'default',
  className = '',
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    right: size === 'large' ? 'w-full md:w-2/3 lg:w-1/2' : 'w-full md:w-96',
    bottom: size === 'large' ? 'h-[85vh]' : 'h-[70vh]',
  };

  const positionClasses = {
    right: `top-0 right-0 h-full ${sizeClasses.right}`,
    bottom: `bottom-0 left-0 right-0 ${sizeClasses.bottom} rounded-t-3xl`,
  };

  const animationClasses = {
    right: 'animate-slide-in-right',
    bottom: 'animate-slide-in-bottom',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Drawer */}
      <div
        className={`fixed ${positionClasses[position]} bg-[#FAFAFA] z-50 shadow-2xl overflow-hidden ${className}`}
        style={{
          animation: position === 'right'
            ? 'slideInRight 0.3s ease-out'
            : 'slideInBottom 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#FAFAFA] border-b-2 border-black/20 px-6 py-4 flex items-center justify-between z-10">
          {title && (
            <h2 className="text-black text-xl font-black uppercase tracking-wide">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-black hover:text-[#48CD8A] transition-colors p-2 -mr-2"
            aria-label="Close drawer"
          >
            <X className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-24 px-6 py-4">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInBottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
