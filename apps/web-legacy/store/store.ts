import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import wardrobeReducer from './slices/wardrobeSlice';
import albumsReducer from './slices/albumsSlice';
import tripsReducer from './slices/tripsSlice';
import featuresReducer from './slices/featuresSlice';
import playgroundReducer from './slices/playgroundSlice';
import tryOnReducer from './slices/tryOnSlice';
import businessReducer from './slices/businessSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer from './slices/ordersSlice';
import reviewsReducer from './slices/reviewsSlice';
import promotionsReducer from './slices/promotionsSlice';
import analyticsReducer from './slices/analyticsSlice';
import cartReducer from './slices/cartSlice';
import userEngagementReducer from './slices/userEngagementSlice';
import wishlistReducer from './slices/wishlistSlice';
import returnsReducer from './slices/returnsSlice';
import toastReducer from './slices/toastSlice';
import sellerKycReducer from './slices/sellerKycSlice';
import businessKycReducer from './slices/businessKycSlice';
import uiOnboardingReducer from './slices/uiOnboardingSlice';

export const store = configureStore({
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
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
