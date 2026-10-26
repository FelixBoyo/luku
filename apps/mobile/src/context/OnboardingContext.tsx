import React, { createContext, useContext } from 'react';

type OnboardingContextValue = {
    markOnboardingDone: () => Promise<void>;
    /** Dev-only: skip auth and open main tabs. Remove before release. */
    devBypassToApp: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const OnboardingProvider: React.FC<{
    value: OnboardingContextValue;
    children: React.ReactNode;
}> = ({ value, children }) => (
    <OnboardingContext.Provider value={value}>
        {children}
    </OnboardingContext.Provider>
);

export const useOnboarding = (): OnboardingContextValue => {
    const ctx = useContext(OnboardingContext);
    if (!ctx) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return ctx;
};
