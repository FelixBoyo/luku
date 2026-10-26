/**

 * POST /api/payments/mpesa/stk-push

 *

 * Initiate M-Pesa STK push payment via Paystack.

 * Uses Paystack's Charge API with mobile_money to trigger STK push on the phone.

 *

 * Reference: https://paystack.com/docs/api/charge#charge

 */



import crypto from 'crypto';

import {

    formatKenyaMpesaPhoneForPaystack,

    isValidKenyaMpesaPhoneForPaystack,

    KENYA_MPESA_PHONE_VALIDATION_MESSAGE,

    toPaystackKenyaMpesaChargePhone,

} from '../../../../core/validation';

import { safeLogger } from '../../../http/redact';

import { PaystackChargeError } from './errors';

import { readPaystackJson } from '../../../payments/paystackResponse';



export { PaystackChargeError } from './errors';



export interface MpesaStkPushRequest {

    amount: number;

    phoneNumber: string;

    accountReference?: string;

    metadata?: Record<string, string>;

}



export interface MpesaStkPushResponse {

    paymentRequestId: string;

    mpesaReference?: string;

    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

    customerMessage: string;

}



const PAYSTACK_BASE_URL = 'https://api.paystack.co';



export const startPaystackMpesaCheckout = async (

    payload: MpesaStkPushRequest,

    requestId?: string,

): Promise<MpesaStkPushResponse> => {

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;



    if (!PAYSTACK_SECRET_KEY) {

        throw new Error('Paystack secret key is not configured');

    }



    const { amount, phoneNumber, accountReference, metadata = {} } = payload;



    if (!amount || amount <= 0) {

        throw new Error('Amount must be a positive number.');

    }



    const formattedPhone = formatKenyaMpesaPhoneForPaystack(phoneNumber);

    if (!isValidKenyaMpesaPhoneForPaystack(formattedPhone)) {

        throw new Error(KENYA_MPESA_PHONE_VALIDATION_MESSAGE);

    }



    const reference = `${accountReference || 'mpesa'}_${crypto.randomUUID()}`;



    if (!metadata.email) {

        throw new Error('A valid email address is required to process this payment.');

    }

    const email = metadata.email;



    try {

        safeLogger.info('Paystack M-Pesa STK push requested', {

            requestId,

            amount,

            phoneLast4: formattedPhone.slice(-4),

            reference,

        });



        const chargeResponse = await fetch(`${PAYSTACK_BASE_URL}/charge`, {

            method: 'POST',

            headers: {

                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({

                amount: amount * 100,

                currency: 'KES',

                email,

                reference,

                metadata,

                mobile_money: {

                    phone: toPaystackKenyaMpesaChargePhone(formattedPhone),

                    provider: 'mpesa',

                },

            }),

        });



        if (!chargeResponse.ok) {

            const errorData = (await chargeResponse.json().catch(() => ({}))) as {

                message?: string;

                code?: string;

                type?: string;

            };

            const paystackRequestId = chargeResponse.headers.get('x-request-id') ?? undefined;

            safeLogger.error('Paystack charge API rejected STK push', {

                requestId,

                httpStatus: chargeResponse.status,

                paystackCode: errorData?.code,

                paystackType: errorData?.type,

                paystackRequestId,

                reference,

                amount,

                phoneLast4: formattedPhone.slice(-4),

            });

            throw new PaystackChargeError(

                errorData?.message || `Paystack API returned ${chargeResponse.status}`,

                chargeResponse.status,

                errorData?.code,

                errorData?.type,

                paystackRequestId,

            );

        }



        const chargeData = await readPaystackJson<{ reference?: string }>(chargeResponse);



        if (!chargeData.status || !chargeData.data) {

            throw new Error('Invalid response from Paystack API');

        }



        const paystackReference = chargeData.data.reference as string | undefined;



        return {

            paymentRequestId: paystackReference || reference,

            mpesaReference: paystackReference || reference,

            status: 'PENDING',

            customerMessage:

                'A payment prompt has been sent to your phone. Please enter your PIN to approve.',

        };

    } catch (error: unknown) {

        if (error instanceof PaystackChargeError) {

            safeLogger.error('Paystack M-Pesa STK push rejected', {

                requestId,

                errorCategory: 'paystack_rejected',

                httpStatus: error.httpStatus,

                error,

            });

            throw error;

        }



        safeLogger.error('Paystack M-Pesa STK push failed unexpectedly', {

            requestId,

            errorCategory: 'network_or_unexpected',

            error,

        });



        const errorMessage =

            error instanceof Error

                ? error.message

                : 'Unable to start M-Pesa payment. Please try again.';

        throw new Error(errorMessage || 'Unable to start M-Pesa payment. Please try again.');

    }

};


