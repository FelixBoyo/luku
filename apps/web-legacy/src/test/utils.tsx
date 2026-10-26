import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { store } from '../../store/store';
import authReducer from '../../store/slices/authSlice';
import wardrobeReducer from '../../store/slices/wardrobeSlice';
import albumsReducer from '../../store/slices/albumsSlice';
import tripsReducer from '../../store/slices/tripsSlice';
import featuresReducer from '../../store/slices/featuresSlice';
import playgroundReducer from '../../store/slices/playgroundSlice';
import tryOnReducer from '../../store/slices/tryOnSlice';
import businessReducer from '../../store/slices/businessSlice';
import productsReducer from '../../store/slices/productsSlice';
import ordersReducer from '../../store/slices/ordersSlice';
import reviewsReducer from '../../store/slices/reviewsSlice';
import promotionsReducer from '../../store/slices/promotionsSlice';
import analyticsReducer from '../../store/slices/analyticsSlice';
import cartReducer from '../../store/slices/cartSlice';
import userEngagementReducer from '../../store/slices/userEngagementSlice';
import wishlistReducer from '../../store/slices/wishlistSlice';
import returnsReducer from '../../store/slices/returnsSlice';
import toastReducer from '../../store/slices/toastSlice';
import sellerKycReducer from '../../store/slices/sellerKycSlice';
import businessKycReducer from '../../store/slices/businessKycSlice';
import uiOnboardingReducer from '../../store/slices/uiOnboardingSlice';

// Create a test store with the same structure as the real store
export const createTestStore = (preloadedState = {}) => {
    return configureStore({
        reducer: {
            auth: authReducer,
            wardrobe: wardrobeReducer,
            albums: albumsReducer,
            trips: tripsReducer,
            features: featuresReducer,
            playground: playgroundReducer,
            tryOn: tryOnReducer,
            business: businessReducer,
            products: productsReducer,
            orders: ordersReducer,
            reviews: reviewsReducer,
            promotions: promotionsReducer,
            analytics: analyticsReducer,
            cart: cartReducer,
            userEngagement: userEngagementReducer,
            wishlist: wishlistReducer,
            returns: returnsReducer,
            toast: toastReducer,
            sellerKyc: sellerKycReducer,
            businessKyc: businessKycReducer,
            uiOnboarding: uiOnboardingReducer,
        },
        preloadedState,
    });
};

// Custom render function that includes Redux Provider
const AllTheProviders = ({
    children,
    store: providedStore,
}: {
    children: React.ReactNode;
    store?: ReturnType<typeof createTestStore>;
}) => {
    const storeToUse = providedStore || store;
    return <Provider store={storeToUse}>{children}</Provider>;
};

type ExtendedRenderOptions = Omit<RenderOptions, 'wrapper'> & {
    store?: ReturnType<typeof createTestStore>;
    /**
     * Optional Redux preloaded state. When provided, a fresh
     * test store is created with this state so that tests can
     * shape the store without touching the real app store.
     */
    preloadedState?: any;
};

const customRender = (ui: ReactElement, options?: ExtendedRenderOptions) => {
    const { store: explicitStore, preloadedState, ...renderOptions } = options || {};

    const storeForTest =
        explicitStore || (preloadedState ? createTestStore(preloadedState) : undefined);

    return render(ui, {
        wrapper: ({ children }) => (
            <AllTheProviders store={storeForTest}>{children}</AllTheProviders>
        ),
        ...renderOptions,
    });
};

export * from '@testing-library/react';
export { customRender as render };
