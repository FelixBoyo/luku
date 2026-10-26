
import React from 'react';

const LightBulbIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c.407.407.822.784 1.29 1.123a3.75 3.75 0 0 0 4.92 0c.468-.339.883-.716 1.29-1.123Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.375 6.375 0 0 0 6.375-6.375V9.75a6.375 6.375 0 0 0-12.75 0v2.625A6.375 6.375 0 0 0 12 18.75Z" />
    </svg>
);

export default LightBulbIcon;
