import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeFromCart, updateQuantity, clearCart } from '../store/slices/cartSlice';
import { Product } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Checkout from './Checkout';
import MultiItemCheckout from './MultiItemCheckout';
import { logEvent } from '../store/slices/userEngagementSlice';

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: (product: Product, quantity: number) => void;
    /**
     * Optional callback fired after a successful checkout.
     * Used by the app shell to route users to My Orders for a consistent post-purchase experience.
     */
    onCheckoutSuccess?: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
    isOpen,
    onClose,
    onCheckout,
    onCheckoutSuccess,
}) => {
    const dispatch = useAppDispatch();
    const { items } = useAppSelector((state) => state.cart);
    const [showCheckout, setShowCheckout] = React.useState(false);
    const [showMultiCheckout, setShowMultiCheckout] = React.useState(false);
    const [checkoutProduct, setCheckoutProduct] = React.useState<{
        product: Product;
        quantity: number;
    } | null>(null);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    const handleRemove = (productId: string) => {
        dispatch(removeFromCart(productId));
    };

    const handleQuantityChange = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            handleRemove(productId);
        } else {
            dispatch(updateQuantity({ productId, quantity }));
        }
    };

    const handleCheckout = () => {
        if (items.length === 0) return;
        
        dispatch(
            logEvent({
                type: 'checkout_started',
                payload: {
                    itemCount: items.length,
                    totalPrice,
                    source: 'cart_sidebar',
                },
            })
        );

        // Use multi-item checkout if more than one item
        if (items.length > 1) {
            setShowMultiCheckout(true);
        } else {
            // Single item checkout (backward compatible)
            const firstItem = items[0];
            setCheckoutProduct({
                product: firstItem.product,
                quantity: firstItem.quantity,
            });
            setShowCheckout(true);
        }
    };

    if (showMultiCheckout) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={() => {
                            setShowMultiCheckout(false);
                        }}
                    />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <MultiItemCheckout
                            items={items}
                            onSuccess={() => {
                                setShowMultiCheckout(false);
                                dispatch(clearCart());
                                onClose();
                                if (onCheckoutSuccess) {
                                    onCheckoutSuccess();
                                }
                            }}
                            onCancel={() => {
                                setShowMultiCheckout(false);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (showCheckout && checkoutProduct) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={() => {
                            setShowCheckout(false);
                            setCheckoutProduct(null);
                        }}
                    />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <Checkout
                            product={checkoutProduct.product}
                            quantity={checkoutProduct.quantity}
                            onSuccess={() => {
                                setShowCheckout(false);
                                setCheckoutProduct(null);
                                dispatch(clearCart());
                                onClose();
                                if (onCheckoutSuccess) {
                                    onCheckoutSuccess();
                                }
                            }}
                            onCancel={() => {
                                setShowCheckout(false);
                                setCheckoutProduct(null);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Shopping Cart
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close cart"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                </svg>
                                <h3 className="mt-4 text-lg font-semibold text-gray-700">
                                    Your cart is empty
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Start shopping to add items to your cart
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.product.id}
                                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                                    >
                                        {item.product.image_urls.length > 0 && (
                                            <img
                                                src={item.product.image_urls[0]}
                                                alt={item.product.name}
                                                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                {item.product.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {item.product.category}
                                            </p>
                                            <p className="text-lg font-bold text-indigo-600 mt-1">
                                                ${item.product.price.toFixed(2)}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            item.product.id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M20 12H4"
                                                        />
                                                    </svg>
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            item.product.id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                    disabled={
                                                        item.quantity >=
                                                        item.product.stock_quantity
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    aria-label="Increase quantity"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 4v16m8-8H4"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleRemove(item.product.id)
                                            }
                                            className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                            aria-label="Remove item"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="border-t border-gray-200 p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">
                                    Total:
                                </span>
                                <span className="text-2xl font-bold text-indigo-600">
                                    ${totalPrice.toFixed(2)}
                                </span>
                            </div>
                            <Button
                                onClick={handleCheckout}
                                className="w-full"
                                disabled={items.length === 0}
                            >
                                Proceed to Checkout
                            </Button>
                            <Button
                                onClick={() => dispatch(clearCart())}
                                variant="secondary"
                                className="w-full"
                            >
                                Clear Cart
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartSidebar;
