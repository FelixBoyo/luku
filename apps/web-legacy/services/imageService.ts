import { supabase } from './supabaseClient';

export const uploadProductImage = async (
    file: File,
    businessId: string
): Promise<string> => {
    const fileName = `products/${businessId}/${Date.now()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '3600',
        });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

    return publicUrl;
};

export const uploadBusinessLogo = async (
    file: File,
    userId: string
): Promise<string> => {
    const fileName = `business-logos/${userId}/${Date.now()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '3600',
        });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName);

    return publicUrl;
};

export const uploadBusinessBanner = async (
    file: File,
    userId: string
): Promise<string> => {
    const fileName = `business-banners/${userId}/${Date.now()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '3600',
        });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName);

    return publicUrl;
};

