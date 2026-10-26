import { apiPost } from './apiClient';

type SignedUploadResponse = {
    signedUrl: string;
    path: string;
    publicUrl: string;
};

export const getWardrobeImageUploadUrl = async (
    filename: string,
    contentType: string,
): Promise<SignedUploadResponse> => {
    const response = await apiPost<SignedUploadResponse>(
        '/v1/api/uploads/wardrobe-images/sign',
        { filename, contentType },
    );
    return response.data;
};

/**
 * PUT the picked image directly to Supabase storage via the signed URL.
 * React Native's fetch handles local file:// / content:// URIs via blob().
 */
export const uploadImageToSignedUrl = async (
    signedUrl: string,
    localUri: string,
    contentType: string,
): Promise<void> => {
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();

    const upload = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
    });

    if (!upload.ok) {
        throw new Error(`Image upload failed (${upload.status})`);
    }
};

export const getListingImageUploadUrl = async (
    filename: string,
    contentType: string,
): Promise<SignedUploadResponse> => {
    const response = await apiPost<SignedUploadResponse>(
        '/v1/api/uploads/wardrobe-images/sign',
        { filename, contentType, context: 'listings' },
    );
    return response.data;
};