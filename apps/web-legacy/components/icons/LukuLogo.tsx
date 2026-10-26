import React from 'react';

interface LukuLogoProps {
    className?: string;
}

const LukuLogo: React.FC<LukuLogoProps> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
        <defs>
            <linearGradient id="lukuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        {/* L shape */}
        <rect x="20" y="20" width="10" height="50" fill="url(#lukuGradient)" rx="3"/>
        <rect x="20" y="62" width="25" height="10" fill="url(#lukuGradient)" rx="3"/>
        {/* Sparkle accent */}
        <circle cx="75" cy="30" r="4" fill="#a855f7"/>
        <path d="M75 20 L75 40 M65 30 L85 30" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);

export default LukuLogo;
