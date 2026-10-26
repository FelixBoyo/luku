import React from 'react';

const SparklePersonIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a15.75 15.75 0 0 1 15 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 18 12l.75-2.25L21 9l-2.25-.75L18 6l-.75 2.25L15 9l2.25.75Z" />
    </svg>
);

export default SparklePersonIcon;