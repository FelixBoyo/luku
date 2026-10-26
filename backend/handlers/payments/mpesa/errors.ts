import { KENYA_MPESA_PHONE_VALIDATION_MESSAGE } from '../../../../core/validation';

export class PaystackChargeError extends Error {
    constructor(
        message: string,
        public readonly httpStatus: number,
        public readonly paystackCode?: string,
        public readonly paystackType?: string,
        public readonly paystackRequestId?: string,
    ) {
        super(message);
        this.name = 'PaystackChargeError';
    }
}

export type MpesaStkPushClientError = {
    httpStatus: number;
    code: string;
    message: string;
};

export const isMpesaInvalidPhoneError = (error: unknown): boolean => {
    if (error instanceof PaystackChargeError) {
        if (error.paystackCode === 'invalid_phone') {
            return true;
        }
        if (/invalid phone number/i.test(error.message)) {
            return true;
        }
        if (error.paystackCode === 'invalid_params' && /phone/i.test(error.message)) {
            return true;
        }
        return false;
    }
    if (error instanceof Error) {
        return (
            error.message === KENYA_MPESA_PHONE_VALIDATION_MESSAGE ||
            /invalid phone number/i.test(error.message)
        );
    }
    return false;
};

export const mapPaystackMpesaStkPushError = (
    error: PaystackChargeError,
): MpesaStkPushClientError => {
    if (isMpesaInvalidPhoneError(error)) {
        const message =
            /invalid phone/i.test(error.message) && error.message !== KENYA_MPESA_PHONE_VALIDATION_MESSAGE
                ? error.message
                : KENYA_MPESA_PHONE_VALIDATION_MESSAGE;
        return { httpStatus: 400, code: 'MPESA_INVALID_PHONE', message };
    }

    if (error.paystackCode === 'unprocessed_transaction') {
        return {
            httpStatus: 400,
            code: 'MPESA_UNPROCESSED',
            message:
                "Payment couldn't be processed. In test mode use Paystack's test number (0710000000); real M-Pesa charges need live keys.",
        };
    }

    const httpStatus =
        error.httpStatus >= 400 && error.httpStatus < 500 ? error.httpStatus : 502;

    return {
        httpStatus,
        code: 'MPESA_STK_PUSH_FAILED',
        message: error.message || 'Unable to start M-Pesa payment.',
    };
};

export const mapMpesaStkPushError = (error: unknown): MpesaStkPushClientError | null => {
    if (error instanceof PaystackChargeError) {
        return mapPaystackMpesaStkPushError(error);
    }

    if (isMpesaInvalidPhoneError(error)) {
        return {
            httpStatus: 400,
            code: 'MPESA_INVALID_PHONE',
            message:
                error instanceof Error ? error.message : KENYA_MPESA_PHONE_VALIDATION_MESSAGE,
        };
    }

    return null;
};
