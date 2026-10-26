
import React from 'react';

const SwatchIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402a3.75 3.75 0 0 0-5.304-5.304L4.098 14.6c-.43.43-.68.995-.68 1.602v2.013c0 .607.25 1.172.68 1.602Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.902 8.098 15.902 5.098a3.75 3.75 0 1 1 5.304 5.304L18.902 12.902M12.902 8.098 8.098 12.902" />
    </svg>
);

export default SwatchIcon;
