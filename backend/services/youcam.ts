
const BASE = 'https://yce-api-01.makeupar.com';

const headers = () => {
    const key = process.env.YOUCAM_API_KEY;

    if (!key) {
        throw new Error('YOUCAM_API_KEY is not set');
    }

    return {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
    };
};

const ACCEPTED_GARMENT_CATEGORIES = [
    'full_body',
    'lower_body',
    'upper_body',
    'shoes',
    'auto',
    'outer',
] as const;

type GarmentCategory = typeof ACCEPTED_GARMENT_CATEGORIES[number];

function normalizeGarmentCategory(category?: string): GarmentCategory {
    const value = (category ?? 'auto').trim().toLowerCase();

    const categoryMap: Record<string, GarmentCategory> = {
        tops: 'upper_body',
        top: 'upper_body',
        shirt: 'upper_body',
        shirts: 'upper_body',
        t_shirt: 'upper_body',
        tshirt: 'upper_body',
        blouse: 'upper_body',
        jacket: 'outer',
        jackets: 'outer',
        coat: 'outer',
        coats: 'outer',
        outerwear: 'outer',

        bottoms: 'lower_body',
        bottom: 'lower_body',
        trousers: 'lower_body',
        pants: 'lower_body',
        jeans: 'lower_body',
        shorts: 'lower_body',
        skirt: 'lower_body',
        skirts: 'lower_body',

        shoe: 'shoes',
        sneakers: 'shoes',
        footwear: 'shoes',

        dress: 'full_body',
        dresses: 'full_body',
        jumpsuit: 'full_body',

        auto: 'auto',
        full_body: 'full_body',
        lower_body: 'lower_body',
        upper_body: 'upper_body',
        shoes: 'shoes',
        outer: 'outer',
    };

    return categoryMap[value] ?? 'auto';
}

export async function uploadImage(buf: Buffer): Promise<string> {
    if (!buf || buf.length === 0) {
        throw new Error('Cannot upload an empty image');
    }
        const isPng =
        buf.length > 8 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47;

    const response = await fetch(`${BASE}/s2s/v2.0/file`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
                files: [
                {
                    // CHANGED: was hardcoded 'image/jpeg' and 'photo.jpg'
                    content_type: isPng ? 'image/png' : 'image/jpeg',
                    file_name: isPng ? 'photo.png' : 'photo.jpg',
                    file_size: buf.length,
                },
            ],
        }),
    });

    const result: any = await response.json();

    if (!response.ok || result.status !== 200) {
        throw new Error(
            `YouCam file API failed: ${JSON.stringify(result)}`
        );
    }

    const file = result.data?.files?.[0];

    if (!file?.file_id || !file?.requests?.[0]?.url) {
        throw new Error('YouCam did not return a valid upload URL or file ID');
    }

    const uploadRequest = file.requests[0];

    const uploadResponse = await fetch(uploadRequest.url, {
        method: uploadRequest.method,
        headers: uploadRequest.headers,
        body: new Uint8Array(buf),
    });

    if (!uploadResponse.ok) {
        throw new Error(
            `YouCam image upload failed with HTTP ${uploadResponse.status}`
        );
    }

    return file.file_id;
}

export async function startTryOn(
    srcFileId: string,
    garmentUrl: string,
    garmentCategory: string = 'auto',
): Promise<string> {
    if (!srcFileId) {
        throw new Error('Source image file ID is missing');
    }

    if (!garmentUrl || !/^https?:\/\//i.test(garmentUrl)) {
        throw new Error('Garment image URL must be a valid HTTP or HTTPS URL');
    }

    const category = normalizeGarmentCategory(garmentCategory);

    const response = await fetch(`${BASE}/s2s/v2.0/task/cloth-v4`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
            src_file_id: srcFileId,
            ref_file_url: garmentUrl,
            garment_category: category,
        }),
    });

    const result: any = await response.json();

    if (!response.ok || result.status !== 200 || !result.data?.task_id) {
        throw new Error(
            `YouCam task creation failed: ${JSON.stringify(result)}`
        );
    }

    return result.data.task_id;
}

export async function getTryOn(
    taskId: string
): Promise<{
    status: 'running' | 'success' | 'error';
    url?: string;
    error?: string;
}> {
    if (!taskId) {
        throw new Error('Try-on task ID is required');
    }

    const response = await fetch(
        `${BASE}/s2s/v2.0/task/cloth-v4/${encodeURIComponent(taskId)}`,
        {
            method: 'GET',
            headers: headers(),
        }
    );

    const result: any = await response.json();

    if (!response.ok || result.status !== 200) {
        throw new Error(
            `YouCam task status request failed: ${JSON.stringify(result)}`
        );
    }

    const taskStatus = result.data?.task_status;

    if (taskStatus === 'success') {
        return {
            status: 'success',
            url: result.data?.results?.url,
        };
    }

    if (taskStatus === 'error' || result.data?.error) {
        return {
            status: 'error',
            error: String(result.data?.error ?? 'Try-on processing failed'),
        };
    }

    return {
        status: 'running',
    };
}
