import React from 'react';

const DevBypassBanner: React.FC = () => {
    return (
        <div className="bg-yellow-400 text-yellow-900 font-bold text-center p-2 text-sm sticky top-0 z-50">
            Developer Bypass Mode is Active. Authentication is disabled.
        </div>
    );
};

export default DevBypassBanner;
