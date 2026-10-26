import React from 'react';

interface CheckCircleIconProps {
  className?: string;
  isFilled?: boolean;
}

const CheckCircleIcon: React.FC<CheckCircleIconProps> = ({ className = "w-6 h-6", isFilled = false }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={isFilled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export default CheckCircleIcon;