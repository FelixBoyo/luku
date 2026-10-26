import React from 'react';

interface SellerVerificationBadgeProps {
    isVerified: boolean;
    businessName?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const SellerVerificationBadge: React.FC<SellerVerificationBadgeProps> = ({
    isVerified,
    businessName,
    className = '',
    size = 'md',
}) => {
    if (!isVerified) return null;

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    return (
        <div className={`inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full font-medium ${sizeClasses[size]} ${className}`}>
            <svg
                className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                />
            </svg>
            <span>Verified Seller{businessName ? ` • ${businessName}` : ''}</span>
        </div>
    );
};

export default SellerVerificationBadge;
