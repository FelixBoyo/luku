import React from 'react';

const LeafPersonIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a15.75 15.75 0 0 1 15 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-3.75 0-7.22-.75-9.75-2.25 1.75-3 4.25-5.25 7.5-5.25s5.75 2.25 7.5 5.25C19.22 21 15.75 21.75 12 21.75Z" clipRule="evenodd" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-3.25 0-5.75-2.25-7.5-5.25C6.78 6 10.25 5.25 12 5.25s5.22.75 7.5 3.75c-1.75 3-4.25 5.25-7.5 5.25Z" />
    </svg>
);


export default LeafPersonIcon;
