import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number; // in milliseconds, default 3000
}

interface ToastState {
    toasts: Toast[];
}

const initialState: ToastState = {
    toasts: [],
};

const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            state.toasts.push({
                id,
                duration: 3000,
                ...action.payload,
            });
        },
        dismissToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
        },
        clearAllToasts: (state) => {
            state.toasts = [];
        },
    },
});

export const { showToast, dismissToast, clearAllToasts } = toastSlice.actions;
export default toastSlice.reducer;
