import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createOrder } from '../store/slices/ordersSlice';
import {
    createPaymentIntent,
    confirmPayment,
    isStripeAvailable,
    initializeStripe,
} from '../services/stripeService';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Product } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { showToast } from '../store/slices/toastSlice';
import { trackEvent } from '../analytics/events';
import { logEvent } from '../store/slices/userEngagementSlice';
import {
    isMpesaAvailable,
    startMpesaCheckout,
    getMpesaPaymentStatus,
    MpesaPaymentStatus,
} from '../services/mpesaService';
import { fetchPaymentsConfig } from '../services/paymentsConfigService';
import {
    createPaystackCharge,
    getPaystackCurrency,
} from '../services/paystackService';

type PaymentMethod =
    | 'stripe_card'
    | 'paystack_card'
    | 'paystack_apple_pay'
    | 'paystack_mpesa';

interface CartItem {
    product: Product;
    quantity: number;
}

interface MultiItemCheckoutProps {
    items: CartItem[];
    onSuccess: () => void;
    onCancel: () => void;
}

// Payment Form Component
const PaymentForm: React.FC<{
    items: CartItem[];
    shippingAddress: any;
    totalPrice: number;
    clientSecret: string;
    onSuccess: () => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
}> = ({ items, shippingAddress, totalPrice, clientSecret, onSuccess, onError, onLoading }) => {
    const dispatch = useAppDispatch();
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const getFriendlyStripeErrorMessage = (error: any): string => {
        const code = error?.code || error?.decline_code;

        switch (code) {
            case 'card_declined':
                return 'Your card was declined. Please use a different card or contact your bank.';
            case 'expired_card':
                return 'This card has expired. Please use a different card.';
            case 'incorrect_cvc':
                return 'The CVC code is incorrect. Please double-check and try again.';
            case 'processing_error':
                return 'There was an error processing your payment. Please try again.';
            case 'insufficient_funds':
                return 'Your card has insufficient funds for this purchase.';
            default:
                return error?.message || 'Payment failed. Please try again.';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            onError('Stripe is not loaded. Please refresh the page.');
            return;
        }

        setProcessing(true);
        onLoading(true);

        try {
            // Confirm payment with Stripe Elements
            const result = await confirmPayment(elements, clientSecret, {
                billing_details: {
                    name: shippingAddress.name,
                    address: {
                        line1: shippingAddress.street,
                        city: shippingAddress.city,
                        state: shippingAddress.state,
                        postal_code: shippingAddress.zip,
                        country: shippingAddress.country,
                    },
                },
            });

            if (result.error) {
                onError(getFriendlyStripeErrorMessage(result.error));
                return;
            }

            if (result.paymentIntent) {
                // Create orders for each item
                const orderPromises = items.map(item =>
                    dispatch(
                        createOrder({
                            product_id: item.product.id,
                            quantity: item.quantity,
                            shipping_address: shippingAddress,
                            stripe_payment_intent_id: result.paymentIntent.id,
                        })
                    ).unwrap()
                );

                await Promise.all(orderPromises);

                dispatch(
                    logEvent({
                        type: 'checkout_completed',
                        payload: {
                            mode: 'multi_item',
                            itemCount: items.length,
                            total: totalPrice,
                            paymentProvider: 'stripe',
                        },
                    })
                );
                onSuccess();
            }
        } catch (err: any) {
            onError(err.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
            onLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
                <PaymentElement />
            </div>
            <Button type="submit" disabled={!stripe || processing} className="w-full">
                {processing ? <Spinner /> : `Pay $${totalPrice.toFixed(2)}`}
            </Button>
        </form>
    );
};

const MultiItemCheckout: React.FC<MultiItemCheckoutProps> = ({
    items,
    onSuccess,
    onCancel,
}) => {
    const session = useAppSelector(state => state.auth.session);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stripeReady, setStripeReady] = useState(false);
    const [stripeInstance, setStripeInstance] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [shippingAddress, setShippingAddress] = useState({
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
    });
    const [validationErrors, setValidationErrors] =
        useState<Record<string, string>>({});
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>('stripe_card');
    const [availableMethods, setAvailableMethods] = useState({
        stripeCard: true,
        paystackCard: false,
        paystackApplePay: false,
        paystackMpesa: false,
    });
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [mpesaStatus, setMpesaStatus] = useState<string | null>(null);
    const [mpesaRequestId, setMpesaRequestId] = useState<string | null>(null);
    const [mpesaPolling, setMpesaPolling] = useState(false);

    const subtotal = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );
    const shippingCost = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const tax = subtotal * 0.08; // 8% tax
    const totalPrice = subtotal + shippingCost + tax;
    const totalItemCount = items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    // Load dynamic payment method configuration
    useEffect(() => {
        const loadConfig = async () => {
            const config = await fetchPaymentsConfig();

            setAvailableMethods({
                stripeCard: config.stripe?.cards ?? isStripeAvailable(),
                paystackCard: !!config.paystack?.cards,
                paystackApplePay: !!config.paystack?.applePay,
                paystackMpesa: !!config.paystack?.mpesa,
            });

            if (!isStripeAvailable() && config.paystack?.mpesa) {
                setPaymentMethod('paystack_mpesa');
            }
        };

        loadConfig();
    }, []);

    // Initialize Stripe and create payment intent
    useEffect(() => {
        if (paymentMethod !== 'stripe_card') {
            return;
        }

        const setupStripe = async () => {
            if (!isStripeAvailable()) {
                setError(
                    'Payment processing is not available. Please contact support.'
                );
                return;
            }

            try {
                const stripe = await initializeStripe();
                if (!stripe) {
                    setError('Failed to initialize payment system.');
                    return;
                }

                setStripeInstance(stripe);

                // Create payment intent for total
                const secret = await createPaymentIntent(
                    totalPrice * 100,
                    'usd',
                    {
                        items_count: items.length.toString(),
                        cart_total: totalPrice.toString(),
                    }
                );

                setClientSecret(secret);
                setStripeReady(true);
            } catch (err: any) {
                setError(err.message || 'Failed to initialize payment.');
            }
        };

        setupStripe();
    }, [items, totalPrice, paymentMethod]);

    // Track checkout start when component mounts
    useEffect(() => {
        trackEvent('checkout_started', {
            cartValue: totalPrice,
            itemCount: totalItemCount,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Poll M-Pesa payment status when a request is active
    useEffect(() => {
        if (!mpesaRequestId || paymentMethod !== 'paystack_mpesa') {
            return;
        }

        let isCancelled = false;
        const startTime = Date.now();
        setMpesaPolling(true);

        const poll = async () => {
            if (isCancelled) return;

            try {
                const statusResponse = await getMpesaPaymentStatus(mpesaRequestId);
                const status: MpesaPaymentStatus = statusResponse.status;

                if (statusResponse.customerMessage) {
                    setMpesaStatus(statusResponse.customerMessage);
                }

                if (status === 'COMPLETED') {
                    setMpesaPolling(false);
                    onSuccess();
                    return;
                }

                if (status === 'FAILED' || status === 'CANCELLED') {
                    setMpesaPolling(false);
                    setError(
                        statusResponse.customerMessage ||
                            'M-Pesa payment was not completed. Please try again.'
                    );
                    return;
                }

                if (Date.now() - startTime < 2 * 60 * 1000) {
                    setTimeout(poll, 3000);
                } else {
                    setMpesaPolling(false);
                    setError(
                        'We could not confirm your M-Pesa payment in time. Please check your M-Pesa app and try again if needed.'
                    );
                }
            } catch (err: any) {
                setMpesaPolling(false);
                setError(
                    err?.message ||
                        'There was an error while checking your M-Pesa payment status.'
                );
            }
        };

        poll();

        return () => {
            isCancelled = true;
        };
    }, [mpesaRequestId, paymentMethod, onSuccess]);

    const handleStartMpesaPayment = async () => {
        if (!availableMethods.paystackMpesa) {
            setError('M-Pesa payments are not available at the moment.');
            return;
        }

        const phoneDigits = mpesaPhone.replace(/\D/g, '');
        if (phoneDigits.length < 9) {
            setError('Please enter a valid M-Pesa phone number.');
            return;
        }

        setError(null);
        setMpesaStatus('Sending M-Pesa STK push to your phone...');
        setLoading(true);

        try {
            const response = await startMpesaCheckout({
                amount: totalPrice,
                phoneNumber: phoneDigits,
                accountReference: `cart-${items.length}-items`,
                metadata: {
                    items_count: items.length.toString(),
                    cart_total: totalPrice.toString(),
                    email: session?.user?.email || '',
                },
            });

            setMpesaRequestId(response.paymentRequestId);

            if (response.customerMessage) {
                setMpesaStatus(response.customerMessage);
            } else {
                setMpesaStatus(
                    'Check your phone and follow the M-Pesa prompt to approve this payment.'
                );
            }
        } catch (err: any) {
            setMpesaStatus(null);
            setError(
                err?.message ||
                    'We were unable to start your M-Pesa payment. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePaystackCharge = async () => {
        setError(null);
        setLoading(true);

        try {
            const method =
                paymentMethod === 'paystack_apple_pay' ? 'apple_pay' : 'card';

            const response = await createPaystackCharge({
                amount: totalPrice,
                currency: getPaystackCurrency(),
                method,
                metadata: {
                    items_count: items.length.toString(),
                    cart_total: totalPrice.toString(),
                    email: session?.user?.email || '',
                },
            });

            if (response.status === 'requires_action' && response.authorizationUrl) {
                // Redirect to Paystack authorization page (e.g., 3DS verification)
                window.location.href = response.authorizationUrl;
                return;
            }

            if (response.status !== 'success') {
                throw new Error(
                    response.message ||
                        'Paystack could not complete this payment. Please try again.'
                );
            }

            // Create orders for each item using the Paystack reference
            const orderPromises = items.map((item) =>
                dispatch(
                    createOrder({
                        product_id: item.product.id,
                        quantity: item.quantity,
                        shipping_address: shippingAddress,
                        stripe_payment_intent_id: response.reference,
                    })
                ).unwrap()
            );

            await Promise.all(orderPromises);

            dispatch(
                logEvent({
                    type: 'checkout_completed',
                    payload: {
                        mode: 'multi_item',
                        itemCount: items.length,
                        total: totalPrice,
                        paymentProvider: 'paystack',
                        paystackMethod: method,
                    },
                })
            );

            onSuccess();
        } catch (err: any) {
            let errorMessage = 'There was a problem processing your Paystack payment.';

            if (err?.message?.includes('insufficient')) {
                errorMessage =
                    'Insufficient funds. Please check your account balance.';
            } else if (err?.message?.includes('card')) {
                errorMessage =
                    'Card payment failed. Please try a different card or payment method.';
            } else if (err?.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start justify-between">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-700 hover:text-red-900 ml-4"
                        aria-label="Dismiss error"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 mb-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                            <span>
                                {item.product.name} x {item.quantity}
                            </span>
                            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                        <span>Total ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                    </label>
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-wrap gap-4">
                            {availableMethods.stripeCard && (
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="h-4 w-4 text-indigo-600 border-gray-300"
                                        checked={paymentMethod === 'stripe_card'}
                                        onChange={() =>
                                            setPaymentMethod('stripe_card')
                                        }
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Card (Stripe)
                                    </span>
                                </label>
                            )}
                            {availableMethods.paystackCard && (
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="h-4 w-4 text-indigo-600 border-gray-300"
                                        checked={
                                            paymentMethod === 'paystack_card'
                                        }
                                        onChange={() =>
                                            setPaymentMethod('paystack_card')
                                        }
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Card (Paystack)
                                    </span>
                                </label>
                            )}
                            {availableMethods.paystackApplePay && (
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="h-4 w-4 text-indigo-600 border-gray-300"
                                        checked={
                                            paymentMethod ===
                                            'paystack_apple_pay'
                                        }
                                        onChange={() =>
                                            setPaymentMethod(
                                                'paystack_apple_pay'
                                            )
                                        }
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Apple Pay (Paystack)
                                    </span>
                                </label>
                            )}
                            {availableMethods.paystackMpesa && (
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="h-4 w-4 text-indigo-600 border-gray-300"
                                            checked={
                                                paymentMethod ===
                                                'paystack_mpesa'
                                            }
                                            onChange={() =>
                                                setPaymentMethod(
                                                    'paystack_mpesa'
                                                )
                                            }
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            M-Pesa (Mobile Money)
                                        </span>
                                    </label>
                                )}
                        </div>
                        {!availableMethods.stripeCard &&
                            !availableMethods.paystackCard &&
                            !availableMethods.paystackApplePay &&
                            !availableMethods.paystackMpesa && (
                                <p className="text-xs text-red-600">
                                    No payment methods are currently available.
                                    Please contact support.
                                </p>
                            )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => {
                            setShippingAddress({ ...shippingAddress, name: e.target.value });
                            if (validationErrors.name) {
                                setValidationErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.name;
                                    return newErrors;
                                });
                            }
                        }}
                        required
                        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {validationErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => {
                            setShippingAddress({ ...shippingAddress, street: e.target.value });
                            if (validationErrors.street) {
                                setValidationErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.street;
                                    return newErrors;
                                });
                            }
                        }}
                        required
                        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            validationErrors.street ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {validationErrors.street && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.street}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => {
                                setShippingAddress({ ...shippingAddress, city: e.target.value });
                                if (validationErrors.city) {
                                    setValidationErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.city;
                                        return newErrors;
                                    });
                                }
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                validationErrors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                        {validationErrors.city && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => {
                                setShippingAddress({ ...shippingAddress, state: e.target.value });
                                if (validationErrors.state) {
                                    setValidationErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.state;
                                        return newErrors;
                                    });
                                }
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                validationErrors.state ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                        {validationErrors.state && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={shippingAddress.zip}
                            onChange={(e) => {
                                setShippingAddress({ ...shippingAddress, zip: e.target.value });
                                if (validationErrors.zip) {
                                    setValidationErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.zip;
                                        return newErrors;
                                    });
                                }
                            }}
                            required
                            pattern="^\d{5}(-\d{4})?$"
                            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                validationErrors.zip ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                        {validationErrors.zip && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.zip}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={shippingAddress.country}
                            onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, country: e.target.value })
                            }
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {paymentMethod === 'stripe_card' && (
                    stripeReady && clientSecret && stripeInstance ? (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Payment Information
                            </h3>
                            <Elements
                                stripe={stripeInstance}
                                options={{
                                    clientSecret,
                                    appearance: {
                                        theme: 'stripe',
                                    },
                                }}
                            >
                                <PaymentForm
                                    items={items}
                                    shippingAddress={shippingAddress}
                                    totalPrice={totalPrice}
                                    clientSecret={clientSecret}
                                    onSuccess={() => {
                                        const errors = validateShippingAddress(shippingAddress);
                                        if (Object.keys(errors).length === 0) {
                                            onSuccess();
                                        } else {
                                            setValidationErrors(errors);
                                            setError('Please fix the errors in the shipping address form.');
                                        }
                                    }}
                                    onError={(errorMsg) => {
                                        setError(errorMsg);
                                        // Validate address when payment fails
                                        const errors = validateShippingAddress(shippingAddress);
                                        if (Object.keys(errors).length > 0) {
                                            setValidationErrors(errors);
                                        }
                                    }}
                                    onLoading={setLoading}
                                />
                            </Elements>
                        </div>
                    ) : loading ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-2">
                                <Spinner />
                                <p className="text-sm text-blue-800">Initializing payment system...</p>
                            </div>
                        </div>
                    ) : !stripeReady ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-2">
                                <Spinner />
                                <p className="text-sm text-yellow-800">Setting up payment form...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Card payments are not currently available.
                                Please try again later or choose another payment method if available.
                            </p>
                        </div>
                    )
                )}

                {paymentMethod === 'paystack_mpesa' && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                M-Pesa Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={mpesaPhone}
                                onChange={(e) => setMpesaPhone(e.target.value)}
                                placeholder="e.g. 0712 345 678 or +2547..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {mpesaStatus && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                {mpesaStatus}
                            </div>
                        )}

                        {mpesaPolling && (
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <Spinner />
                                <span>Waiting for M-Pesa confirmation...</span>
                            </div>
                        )}

                        <Button
                            type="button"
                            className="w-full"
                            disabled={loading || mpesaPolling}
                            onClick={handleStartMpesaPayment}
                        >
                            {loading ? (
                                <Spinner />
                            ) : (
                                `Pay with M-Pesa (${totalPrice.toFixed(2)} total)`
                            )}
                        </Button>
                    </div>
                )}

                {paymentMethod === 'paystack_card' ||
                paymentMethod === 'paystack_apple_pay' ? (
                    <div className="mt-4">
                        <Button
                            type="button"
                            className="w-full"
                            disabled={loading}
                            onClick={handlePaystackCharge}
                        >
                            {loading ? (
                                <Spinner />
                            ) : paymentMethod === 'paystack_apple_pay' ? (
                                `Pay with Apple Pay (Paystack) $${totalPrice.toFixed(
                                    2
                                )}`
                            ) : (
                                `Pay with Card (Paystack) $${totalPrice.toFixed(
                                    2
                                )}`
                            )}
                        </Button>
                    </div>
                ) : null}

                <div className="flex space-x-4 mt-6">
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MultiItemCheckout;
