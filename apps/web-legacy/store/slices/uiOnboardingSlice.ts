import { createSlice } from '@reduxjs/toolkit';

export interface UiOnboardingState {
    /**
     * Tracks whether the user has dismissed the initial Lifestyle Hub onboarding banner.
     * This is kept in-memory for now (no persistence) to keep the pre-MVP lightweight.
     */
    hasCompletedHubOnboarding: boolean;
}

const initialState: UiOnboardingState = {
    hasCompletedHubOnboarding: false,
};

const uiOnboardingSlice = createSlice({
    name: 'uiOnboarding',
    initialState,
    reducers: {
        completeHubOnboarding(state) {
            state.hasCompletedHubOnboarding = true;
        },
    },
});

export const { completeHubOnboarding } = uiOnboardingSlice.actions;
export default uiOnboardingSlice.reducer;

