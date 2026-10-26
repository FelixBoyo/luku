export const shareProduct = async (productId: string, productName: string): Promise<void> => {
    const productUrl = `${window.location.origin}${window.location.pathname}#product/${productId}`;
    const shareText = `Check out ${productName} on LUKU!`;

    if (navigator.share) {
        // Use native Web Share API if available
        try {
            await navigator.share({
                title: productName,
                text: shareText,
                url: productUrl,
            });
            return;
        } catch (error) {
            // User cancelled or error occurred, fall back to clipboard
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing:', error);
            }
        }
    }

    // Fallback to clipboard
    try {
        await navigator.clipboard.writeText(`${shareText} ${productUrl}`);
        // Show success message (caller should handle this)
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        throw new Error('Failed to share product');
    }
};

export const copyProductLink = async (productId: string): Promise<void> => {
    const productUrl = `${window.location.origin}${window.location.pathname}#product/${productId}`;
    
    try {
        await navigator.clipboard.writeText(productUrl);
    } catch (error) {
        console.error('Failed to copy link:', error);
        throw new Error('Failed to copy link');
    }
};

export const shareToTwitter = (productId: string, productName: string): void => {
    const productUrl = `${window.location.origin}${window.location.pathname}#product/${productId}`;
    const text = encodeURIComponent(`Check out ${productName} on LUKU!`);
    const url = encodeURIComponent(productUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
};

export const shareToFacebook = (productId: string): void => {
    const productUrl = `${window.location.origin}${window.location.pathname}#product/${productId}`;
    const url = encodeURIComponent(productUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
};

export const shareViaEmail = (productId: string, productName: string): void => {
    const productUrl = `${window.location.origin}${window.location.pathname}#product/${productId}`;
    const subject = encodeURIComponent(`Check out ${productName} on LUKU!`);
    const body = encodeURIComponent(`I thought you might like this product: ${productName}\n\n${productUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
};
