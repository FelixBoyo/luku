import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}) => {
    const baseClasses = 'bg-gray-200 rounded';
    const variantClasses = {
        text: 'h-4',
        circular: 'rounded-full',
        rectangular: 'rounded',
    };
    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-[shimmer_2s_infinite]',
        none: '',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
            aria-label="Loading..."
            role="status"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};

// Pre-built skeleton components for common use cases
export const ProductCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Skeleton variant="rectangular" height={256} className="w-full" />
        <div className="p-4 space-y-3">
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="60%" height={16} />
            <div className="flex justify-between items-center">
                <Skeleton variant="text" width={60} height={24} />
                <Skeleton variant="circular" width={20} height={20} />
            </div>
        </div>
    </div>
);

export const OrderCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-2 flex-1">
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="text" width="60%" height={16} />
            </div>
            <Skeleton variant="rectangular" width={100} height={32} className="rounded-full" />
        </div>
        <Skeleton variant="rectangular" height={120} className="w-full mb-4" />
        <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                    <Skeleton variant="text" width="100%" height={14} />
                    <Skeleton variant="text" width="80%" height={18} />
                </div>
            ))}
        </div>
    </div>
);

export const WishlistItemSkeleton: React.FC = () => (
    <div className="relative group">
        <ProductCardSkeleton />
        <div className="absolute top-3 right-3 z-10">
            <Skeleton variant="circular" width={32} height={32} />
        </div>
    </div>
);

export default Skeleton;
