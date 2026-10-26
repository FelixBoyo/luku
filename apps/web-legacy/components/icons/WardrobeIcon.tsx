
import React from 'react';

const WardrobeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5v10.5h-7.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75V17.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5v10.5H3.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
    </svg>
);

export default WardrobeIcon;
