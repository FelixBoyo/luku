/**

 * GET /api/payments/mpesa/requests/:id

 *

 * Check the status of an M-Pesa payment request.

 * Uses Paystack's Charge API (matches STK push via POST /charge).

 *

 * Reference: https://paystack.com/docs/api/charge#charge

 */



import { safeLogger } from '../../../http/redact';

import { PaystackChargeError } from './errors';

import { readPaystackJson } from '../../../payments/paystackResponse';



type PaystackChargeData = {

    status: string;

    reference?: string;

    gateway_response?: string;

    message?: string;

};



export interface MpesaStatusResponse {

    paymentRequestId: string;

    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

    mpesaReference?: string;

    customerMessage: string;

}



const PAYSTACK_BASE_URL = 'https://api.paystack.co';



/**

 * Map Paystack Charge API status to our status enum.

 * Waiting / in-progress charge states must not map to CANCELLED.

 */

const mapPaystackChargeStatus = (

    paystackStatus: string,

): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' => {

    switch (paystackStatus?.toLowerCase()) {

        case 'success':

            return 'COMPLETED';

        case 'failed':

            return 'FAILED';

        case 'pending':

            return 'PENDING';

        case 'send_otp':

        case 'send_pin':

        case 'send_phone':

        case 'send_birthday':

        case 'open_url':

        case 'pay_offline':

            return 'PROCESSING';

        default:

            return 'PROCESSING';

    }

};



/**

 * Handler for GET /api/payments/mpesa/requests/:id

 */

export const getPaystackMpesaStatus = async (

    paymentRequestId: string,

    requestId?: string,

): Promise<MpesaStatusResponse> => {

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;



    if (!PAYSTACK_SECRET_KEY) {

        throw new Error('Paystack secret key is not configured');

    }



    if (!paymentRequestId) {

        throw new Error('Payment request ID is required');

    }



    try {

        const chargeResponse = await fetch(

            `${PAYSTACK_BASE_URL}/charge/${encodeURIComponent(paymentRequestId)}`,

            {

                headers: {

                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,

                },

            },

        );



        if (!chargeResponse.ok) {

            const errorData = (await chargeResponse.json().catch(() => ({}))) as {

                message?: string;

                code?: string;

                type?: string;

            };

            const paystackRequestId = chargeResponse.headers.get('x-request-id') ?? undefined;

            safeLogger.error('Paystack charge API rejected status fetch', {

                requestId,

                paymentRequestId,

                httpStatus: chargeResponse.status,

                paystackCode: errorData?.code,

                paystackType: errorData?.type,

                paystackRequestId,

            });

            throw new PaystackChargeError(

                errorData?.message || `Paystack API returned ${chargeResponse.status}`,

                chargeResponse.status,

                errorData?.code,

                errorData?.type,

                paystackRequestId,

            );

        }



        const chargeData = await readPaystackJson<PaystackChargeData>(chargeResponse);



        if (!chargeData.status || !chargeData.data) {

            throw new Error('Invalid response from Paystack API');

        }



        const charge = chargeData.data;

        const status = mapPaystackChargeStatus(charge.status);



        let customerMessage = 'Payment is being processed.';



        if (status === 'COMPLETED') {

            customerMessage = 'Payment completed successfully.';

        } else if (status === 'FAILED') {

            customerMessage =

                charge.gateway_response || charge.message || 'Payment failed.';

        } else if (status === 'PENDING') {

            customerMessage =

                'Payment is pending. Please check your phone and complete the transaction.';

        } else if (status === 'PROCESSING') {

            customerMessage = 'Check your phone and approve the M-Pesa prompt.';

        }



        return {

            paymentRequestId,

            status,

            mpesaReference: charge.reference ?? paymentRequestId,

            customerMessage,

        };

    } catch (error: unknown) {

        if (error instanceof PaystackChargeError) {

            safeLogger.error('Get Paystack M-Pesa status rejected', {

                requestId,

                errorCategory: 'paystack_rejected',

                httpStatus: error.httpStatus,

                error,

            });

        } else {

            safeLogger.error('Get Paystack M-Pesa status failed unexpectedly', {

                requestId,

                errorCategory: 'network_or_unexpected',

                error,

            });

        }



        const errorMessage =

            error instanceof Error ? error.message : 'Unable to fetch payment status.';

        throw new Error(errorMessage || 'Unable to fetch payment status.');

    }

};


