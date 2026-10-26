import React from 'react';

const LeafIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a12.022 12.022 0 0 0-5.84 2.56M12 12v9.75m0-9.75a12.008 12.008 0 0 0-5.02-9.22L6.38 3.05a12.022 12.022 0 0 1 11.24 0l-1.6 1.73m-5.64 5.44A12.032 12.032 0 0 1 12 2.25a12.032 12.032 0 0 1 5.64 5.44m0 0l-1.83 1.98m-3.81-5.44a12.034 12.034 0 0 0-3.81 5.44m0 0l1.83 1.98" />
    </svg>
);

export default LeafIcon;
