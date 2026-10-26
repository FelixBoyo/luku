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

interface CheckoutProps {
    product: Product;
    quantity: number;
    onSuccess: () => void;
    onCancel: () => void;
}

// Payment Form Component (uses Stripe Elements)
const PaymentForm: React.FC<{
    product: Product;
    quantity: number;
    shippingAddress: any;
    clientSecret: string;
    onSuccess: () => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
}> = ({ product, quantity, shippingAddress, clientSecret, onSuccess, onError, onLoading }) => {
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
                // Create order
                await dispatch(
                    createOrder({
                        product_id: product.id,
                        quantity,
                        shipping_address: shippingAddress,
                        stripe_payment_intent_id: result.paymentIntent.id,
                    })
                ).unwrap();

                dispatch(
                    logEvent({
                        type: 'checkout_completed',
                        payload: {
                            productId: product.id,
                            quantity,
                            total: product.price * quantity,
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
                {processing ? <Spinner /> : `Pay $${(product.price * quantity).toFixed(2)}`}
            </Button>
        </form>
    );
};

const Checkout: React.FC<CheckoutProps> = ({
    product,
    quantity,
    onSuccess,
    onCancel,
}) => {
    const dispatch = useAppDispatch();
    const session = useAppSelector(state => state.auth.session);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stripeReady, setStripeReady] = useState(false);
    const [stripeInstance, setStripeInstance] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
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
    const [shippingAddress, setShippingAddress] = useState({
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
    });

    const totalPrice = product.price * quantity;

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

            // If Stripe is unavailable but Paystack M-Pesa is, default to M-Pesa
            if (!isStripeAvailable() && config.paystack?.mpesa) {
                setPaymentMethod('paystack_mpesa');
            }
        };

        loadConfig();
    }, []);

    // Initialize Stripe and create payment intent
    useEffect(() => {
        if (paymentMethod !== 'stripe_card') {
            // When switching away from card, we don't need to initialize Stripe
            return;
        }

        const setupStripe = async () => {
            if (!isStripeAvailable()) {
                setError('Payment processing is not available. Please contact support.');
                return;
            }

            try {
                const stripe = await initializeStripe();
                if (!stripe) {
                    setError('Failed to initialize payment system.');
                    return;
                }

                setStripeInstance(stripe);

                // Create payment intent
                const secret = await createPaymentIntent(
                    totalPrice * 100,
                    'usd',
                    {
                        product_id: product.id,
                        quantity: quantity.toString(),
                    }
                );

                // Check if this is a mock client secret (development mode)
                const isMockSecret = secret.startsWith('pi_mock_');
                
                if (isMockSecret) {
                    // In development/mock mode, don't use Stripe Elements
                    // Show development message instead
                    setClientSecret(null);
                    setStripeReady(false);
                    setLoading(false);
                    return;
                }

                setClientSecret(secret);
                setStripeReady(true);
            } catch (err: any) {
                setError(err.message || 'Failed to initialize payment.');
            }
        };

        setupStripe();
    }, [product.id, quantity, totalPrice, paymentMethod]);

    // Track checkout start when component mounts
    useEffect(() => {
        trackEvent('checkout_started', {
            cartValue: totalPrice,
            itemCount: quantity,
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

                // Continue polling while pending/processing within timeout window
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
                accountReference: product.id,
                metadata: {
                    product_id: product.id,
                    quantity: quantity.toString(),
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
                    product_id: product.id,
                    quantity: quantity.toString(),
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

            await dispatch(
                createOrder({
                    product_id: product.id,
                    quantity,
                    shipping_address: shippingAddress,
                    // Reuse this field for now to store the Paystack reference
                    stripe_payment_intent_id: response.reference,
                })
            ).unwrap();

            dispatch(
                logEvent({
                    type: 'checkout_completed',
                    payload: {
                        productId: product.id,
                        quantity,
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
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                <div className="flex justify-between mb-2">
                    <span>{product.name} x {quantity}</span>
                    <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                    </span>
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
                        onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, name: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, street: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, city: e.target.value })
                            }
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, state: e.target.value })
                            }
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
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
                            onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, zip: e.target.value })
                            }
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
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
                    stripeReady &&
                    clientSecret &&
                    stripeInstance &&
                    !clientSecret.startsWith('pi_mock_') ? (
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
                                    product={product}
                                    quantity={quantity}
                                    shippingAddress={shippingAddress}
                                    clientSecret={clientSecret}
                                    onSuccess={onSuccess}
                                    onError={setError}
                                    onLoading={setLoading}
                                />
                            </Elements>
                        </div>
                    ) : loading ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-2">
                                <Spinner />
                                <p className="text-sm text-blue-800">
                                    Loading payment form...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                                        Development Mode
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                        Card payments are not currently available. Please try again
                                        later or choose another payment method if available.
                                    </p>
                                </div>
                            </div>
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
                            {loading ? <Spinner /> : `Pay with M-Pesa (${totalPrice.toFixed(2)} total)`}
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

export default Checkout;
