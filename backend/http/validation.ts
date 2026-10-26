import type { MpesaStkPushRequest } from '../handlers/payments/mpesa/stk-push';
import type { PaystackChargeRequest } from '../handlers/payments/paystack/charges';
import type { CreateOrderRequest } from '../../packages/contracts/src/orders';
import {
    isValidEmail,
    isValidKenyaMpesaPhoneForPaystack,
    formatKenyaMpesaPhoneForPaystack,
    KENYA_MPESA_PHONE_VALIDATION_MESSAGE,
} from '../../core/validation';

export interface ValidationErrorDetails {
    field: string;
    message: string;
}

export class RequestValidationError extends Error {
    readonly code = 'VALIDATION_ERROR';
    readonly details: ValidationErrorDetails[];

    constructor(message: string, details: ValidationErrorDetails[]) {
        super(message);
        this.name = 'RequestValidationError';
        this.details = details;
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Declared as a function so control-flow analysis treats a call as terminating,
 * which preserves the `isRecord` narrowing in the validators below.
 */
function toValidationError(
    message: string,
    details: ValidationErrorDetails[]
): never {
    throw new RequestValidationError(message, details);
}

export const validatePaystackChargeBody = (
    body: unknown
): PaystackChargeRequest => {
    if (!isRecord(body)) {
        toValidationError('Invalid request body.', [
            { field: 'body', message: 'Request body must be a JSON object.' },
        ]);
    }

    const details: ValidationErrorDetails[] = [];
    const amount = body.amount;
    const method = body.method;
    const currency = body.currency;
    const metadata = body.metadata;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        details.push({
            field: 'amount',
            message: 'Amount must be a positive number.',
        });
    }

    if (method !== 'card' && method !== 'apple_pay') {
        details.push({
            field: 'method',
            message: 'Method must be either "card" or "apple_pay".',
        });
    }

    if (currency !== undefined && (typeof currency !== 'string' || currency.trim().length === 0)) {
        details.push({
            field: 'currency',
            message: 'Currency must be a non-empty string when provided.',
        });
    }

    if (metadata !== undefined && !isRecord(metadata)) {
        details.push({
            field: 'metadata',
            message: 'Metadata must be an object when provided.',
        });
    }

    const email = isRecord(metadata) ? metadata.email : undefined;
    if (typeof email !== 'string' || !isValidEmail(email)) {
        details.push({
            field: 'metadata.email',
            message: 'A valid email address is required.',
        });
    }

    if (details.length > 0) {
        toValidationError('Invalid payment charge request.', details);
    }

    return body as unknown as PaystackChargeRequest;
};

export const validateMpesaStkPushBody = (
    body: unknown
): MpesaStkPushRequest => {
    if (!isRecord(body)) {
        toValidationError('Invalid request body.', [
            { field: 'body', message: 'Request body must be a JSON object.' },
        ]);
    }

    const details: ValidationErrorDetails[] = [];
    const amount = body.amount;
    const phoneNumber = body.phoneNumber;
    const accountReference = body.accountReference;
    const metadata = body.metadata;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        details.push({
            field: 'amount',
            message: 'Amount must be a positive number.',
        });
    }

    if (typeof phoneNumber !== 'string' || phoneNumber.trim().length < 9) {
        details.push({
            field: 'phoneNumber',
            message: 'Phone number must be a valid M-Pesa number.',
        });
    } else {
        const formatted = formatKenyaMpesaPhoneForPaystack(phoneNumber);
        if (!isValidKenyaMpesaPhoneForPaystack(formatted)) {
            details.push({
                field: 'phoneNumber',
                message: KENYA_MPESA_PHONE_VALIDATION_MESSAGE,
            });
        }
    }

    if (accountReference !== undefined && (typeof accountReference !== 'string' || accountReference.trim().length === 0)) {
        details.push({
            field: 'accountReference',
            message: 'Account reference must be a non-empty string when provided.',
        });
    }

    if (metadata !== undefined && !isRecord(metadata)) {
        details.push({
            field: 'metadata',
            message: 'Metadata must be an object when provided.',
        });
    }

    const email = isRecord(metadata) ? metadata.email : undefined;
    if (typeof email !== 'string' || !isValidEmail(email)) {
        details.push({
            field: 'metadata.email',
            message: 'A valid email address is required.',
        });
    }

    if (details.length > 0) {
        toValidationError('Invalid M-Pesa STK push request.', details);
    }

    return body as unknown as MpesaStkPushRequest;
};

const asNonEmptyString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

/**
 * Escrow orders take a catalog `productId` or a peer `listingId`, never both.
 * Enforced here as well as by `orders_item_source_check` in the database.
 */
export const validateCreateOrderBody = (body: unknown): CreateOrderRequest => {
    if (!isRecord(body)) {
        toValidationError('Invalid request body.', [
            { field: 'body', message: 'Request body must be a JSON object.' },
        ]);
    }

    const details: ValidationErrorDetails[] = [];
    const paymentReference =
        asNonEmptyString(body.paymentReference) ??
        asNonEmptyString(body.stripePaymentIntentId);

    if (!paymentReference) {
        details.push({
            field: 'paymentReference',
            message: 'Payment transaction reference is required.',
        });
    }

    if (!isRecord(body.shippingAddress)) {
        details.push({
            field: 'shippingAddress',
            message: 'Shipping address is required.',
        });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        details.push({
            field: 'items',
            message: 'Order items list is required.',
        });
    } else {
        body.items.forEach((item, index) => {
            if (!isRecord(item)) {
                details.push({
                    field: `items[${index}]`,
                    message: 'Order item must be an object.',
                });
                return;
            }

            const productId = asNonEmptyString(item.productId);
            const listingId = asNonEmptyString(item.listingId);

            if (Boolean(productId) === Boolean(listingId)) {
                details.push({
                    field: `items[${index}]`,
                    message: 'Provide exactly one of productId or listingId.',
                });
            }

            const quantity = item.quantity;
            if (
                typeof quantity !== 'number' ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                details.push({
                    field: `items[${index}].quantity`,
                    message: 'Quantity must be a positive integer.',
                });
            }
        });
    }

    if (details.length > 0) {
        toValidationError('Invalid order request.', details);
    }

    return {
        ...(body as CreateOrderRequest),
        paymentReference: paymentReference as string,
    };
};

export const validateMpesaStatusParams = (
    params: unknown
): { id: string } => {
    if (!isRecord(params)) {
        toValidationError('Invalid request params.', [
            { field: 'params', message: 'Request params are required.' },
        ]);
    }

    const id = params.id;
    if (typeof id !== 'string' || id.trim().length === 0) {
        toValidationError('Invalid M-Pesa status request.', [
            { field: 'id', message: 'Payment request ID is required.' },
        ]);
    }

    return { id: id.trim() };
};
