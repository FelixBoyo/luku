import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { dismissToast, Toast as ToastType } from '../../store/slices/toastSlice';

const Toast: React.FC<{ toast: ToastType }> = ({ toast }) => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(dismissToast(toast.id));
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, dispatch]);

    const getToastStyles = () => {
        const baseStyles = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px]';
        switch (toast.type) {
            case 'success':
                return `${baseStyles} bg-green-50 border border-green-200 text-green-800`;
            case 'error':
                return `${baseStyles} bg-red-50 border border-red-200 text-red-800`;
            case 'warning':
                return `${baseStyles} bg-yellow-50 border border-yellow-200 text-yellow-800`;
            case 'info':
            default:
                return `${baseStyles} bg-blue-50 border border-blue-200 text-blue-800`;
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div
            className={`${getToastStyles()} animate-in slide-in-from-right-5 duration-300`}
            role="alert"
        >
            {getIcon()}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => dispatch(dismissToast(toast.id))}
                className="text-current opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const toasts = useAppSelector((state) => state.toast.toasts);

    if (toasts.length === 0) return null;

    const container = document.getElementById('toast-container') || document.body;

    return createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2 flex flex-col items-end">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>,
        container
    );
};

export default ToastContainer;
