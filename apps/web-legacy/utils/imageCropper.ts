export const cropImage = async (
    base64Image: string,
    mimeType: string,
    boundingBox: { x: number; y: number; width: number; height: number }
): Promise<{ base64Image: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Calculate actual pixel coordinates from normalized values (0-1)
            const x = Math.max(0, boundingBox.x * img.width);
            const y = Math.max(0, boundingBox.y * img.height);
            const width = Math.min(
                boundingBox.width * img.width,
                img.width - x
            );
            const height = Math.min(
                boundingBox.height * img.height,
                img.height - y
            );

            canvas.width = width;
            canvas.height = height;

            // Draw the cropped portion
            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

            // Convert to base64
            const croppedBase64 = canvas.toDataURL(mimeType);
            const base64String = croppedBase64.split(',')[1];

            resolve({
                base64Image: base64String,
                mimeType: mimeType,
            });
        };
        img.onerror = reject;
        img.src = `data:${mimeType};base64,${base64Image}`;
    });
};

