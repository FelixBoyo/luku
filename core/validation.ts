/**
 * Validation utilities for backend operations
 * Provides reusable validation functions for common data types
 */

import type { OrderStatus } from '../packages/contracts/src/orders';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
    return UUID_REGEX.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/** User-facing message when M-Pesa phone fails local validation. */
export const KENYA_MPESA_PHONE_VALIDATION_MESSAGE =
    'Use a Kenyan M-Pesa number (07XX or 2547XX).';

const KENYA_MPESA_MSISDN_REGEX = /^254[17]\d{8}$/;

/**
 * Normalize user input to Paystack Kenya M-Pesa MSISDN (254 + 9 digits).
 */
export function formatKenyaMpesaPhoneForPaystack(raw: string): string {
    const phoneDigits = raw.replace(/\D/g, '');
    if (phoneDigits.length === 0) {
        return '';
    }

    if (phoneDigits.startsWith('2540')) {
        return `254${phoneDigits.slice(4)}`;
    }

    if (phoneDigits.startsWith('254')) {
        return phoneDigits;
    }

    if (phoneDigits.startsWith('0')) {
        return `254${phoneDigits.slice(1)}`;
    }

    return `254${phoneDigits}`;
}

export function isValidKenyaMpesaPhoneForPaystack(formatted: string): boolean {
    return KENYA_MPESA_MSISDN_REGEX.test(formatted);
}

/**
 * Validate and format a raw phone string for Paystack M-Pesa, or return null if invalid.
 */
export function parseKenyaMpesaPhoneForPaystack(raw: string): string | null {
    const formatted = formatKenyaMpesaPhoneForPaystack(raw);
    if (!isValidKenyaMpesaPhoneForPaystack(formatted)) {
        return null;
    }
    return formatted;
}

/** E.164 wire format for Paystack Charge API mobile_money.phone (Kenya M-Pesa STK). */
export function toPaystackKenyaMpesaChargePhone(formatted254Msisdn: string): string {
    const digits = formatted254Msisdn.replace(/\D/g, '');
    return digits.startsWith('254') ? `+${digits}` : `+254${digits}`;
}

/**
 * Validate that a number is positive
 */
export function isPositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validate that a number is non-negative
 */
export function isNonNegativeNumber(value: number): boolean {
    return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Validate price (must be positive and have max 2 decimal places)
 */
export function isValidPrice(price: number): boolean {
    if (!isPositiveNumber(price)) return false;
    // Check decimal places
    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
}

/**
 * Validate quantity (must be positive integer)
 */
export function isValidQuantity(quantity: number): boolean {
    return Number.isInteger(quantity) && quantity > 0;
}

/**
 * Every escrow order status (ADR-11). Typed as a full record of the union so a
 * new status is a compile error here rather than a silently rejected value.
 */
const ORDER_STATUSES: Record<OrderStatus, true> = {
    pending_payment: true,
    paid: true,
    in_escrow: true,
    shipped: true,
    delivered: true,
    released: true,
    completed: true,
    cancelled: true,
    refunded: true,
    disputed: true,
};

/**
 * Validate order status enum
 */
export function isValidOrderStatus(status: string): status is OrderStatus {
    return Object.prototype.hasOwnProperty.call(ORDER_STATUSES, status);
}

/**
 * Alias for isValidOrderStatus for backward compatibility
 */
export const validateOrderStatus = isValidOrderStatus;

/**
 * Validate shipping address structure
 */
export interface ShippingAddress {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    [key: string]: any; // Allow additional fields
}

export function isValidShippingAddress(address: any): address is ShippingAddress {
    if (!address || typeof address !== 'object') return false;

    return (
        typeof address.street === 'string' && address.street.trim().length > 0 &&
        typeof address.city === 'string' && address.city.trim().length > 0 &&
        typeof address.zipCode === 'string' && address.zipCode.trim().length > 0 &&
        typeof address.country === 'string' && address.country.trim().length > 0
    );
}

/**
 * Validate product data
 */
export interface ProductValidationErrors {
    name?: string;
    price?: string;
    category?: string;
    color?: string;
    style?: string;
    season?: string;
    size?: string;
    stock_quantity?: string;
    image_urls?: string;
}

export function validateProductData(productData: {
    name?: string;
    price?: number;
    category?: string;
    color?: string;
    style?: string;
    season?: string;
    size?: string;
    stock_quantity?: number;
    image_urls?: string[];
}): { isValid: boolean; errors: ProductValidationErrors } {
    const errors: ProductValidationErrors = {};

    if (!productData.name || typeof productData.name !== 'string' || productData.name.trim().length === 0) {
        errors.name = 'Product name is required';
    }

    if (productData.price !== undefined) {
        if (!isValidPrice(productData.price)) {
            errors.price = 'Price must be a positive number with max 2 decimal places';
        }
    } else {
        errors.price = 'Price is required';
    }

    if (!productData.category || typeof productData.category !== 'string' || productData.category.trim().length === 0) {
        errors.category = 'Category is required';
    }

    if (!productData.color || typeof productData.color !== 'string' || productData.color.trim().length === 0) {
        errors.color = 'Color is required';
    }

    if (!productData.style || typeof productData.style !== 'string' || productData.style.trim().length === 0) {
        errors.style = 'Style is required';
    }

    if (!productData.season || typeof productData.season !== 'string' || productData.season.trim().length === 0) {
        errors.season = 'Season is required';
    }

    if (!productData.size || typeof productData.size !== 'string' || productData.size.trim().length === 0) {
        errors.size = 'Size is required';
    }

    if (productData.stock_quantity !== undefined) {
        if (!isNonNegativeNumber(productData.stock_quantity) || !Number.isInteger(productData.stock_quantity)) {
            errors.stock_quantity = 'Stock quantity must be a non-negative integer';
        }
    } else {
        errors.stock_quantity = 'Stock quantity is required';
    }

    if (productData.image_urls !== undefined) {
        if (!Array.isArray(productData.image_urls)) {
            errors.image_urls = 'Image URLs must be an array';
        } else if (productData.image_urls.length === 0) {
            errors.image_urls = 'At least one image URL is required';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Validate order creation data
 */
export interface OrderValidationErrors {
    product_id?: string;
    quantity?: string;
    shipping_address?: string;
    payment_reference?: string;
}

export function validateOrderData(orderData: {
    product_id?: string;
    quantity?: number;
    shipping_address?: any;
    payment_reference?: string;
    /** @deprecated Stripe-era alias for `payment_reference`. */
    stripe_payment_intent_id?: string;
}): { isValid: boolean; errors: OrderValidationErrors } {
    const errors: OrderValidationErrors = {};

    if (!orderData.product_id || !isValidUUID(orderData.product_id)) {
        errors.product_id = 'Valid product ID (UUID) is required';
    }

    if (orderData.quantity === undefined || !isValidQuantity(orderData.quantity)) {
        errors.quantity = 'Quantity must be a positive integer';
    }

    if (!isValidShippingAddress(orderData.shipping_address)) {
        errors.shipping_address = 'Valid shipping address is required (street, city, zipCode, country)';
    }

    const paymentReference =
        orderData.payment_reference ?? orderData.stripe_payment_intent_id;

    if (typeof paymentReference !== 'string' || paymentReference.trim().length === 0) {
        errors.payment_reference = 'Payment transaction reference is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Get user-friendly error message from validation errors
 */
export function getValidationErrorMessage(errors: Record<string, string | undefined>): string {
    const errorMessages = Object.values(errors).filter((msg): msg is string => !!msg);
    if (errorMessages.length === 0) return 'Validation failed';
    if (errorMessages.length === 1) return errorMessages[0];
    return `Multiple validation errors: ${errorMessages.join(', ')}`;
}

/**
 * Validate that a string is not empty
 */
export function isNonEmptyString(value: string): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate array is not empty
 */
export function isNonEmptyArray<T>(value: T[]): boolean {
    return Array.isArray(value) && value.length > 0;
}
