
import React from 'react';

const RectangleStackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 12l4.179 2.25m0 0 5.571 3 5.571-3m0 0L21.75 12l-4.179-2.25m-11.142 0-5.571 3 5.571 3M6.429 9.75l5.571-3 5.571 3m0 0l4.179 2.25-4.179 2.25M6.429 9.75l-4.179 2.25 4.179 2.25m11.142 0-4.179 2.25 4.179 2.25" />
    </svg>
);

export default RectangleStackIcon;
