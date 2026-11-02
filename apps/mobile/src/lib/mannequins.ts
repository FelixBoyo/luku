import { Asset } from 'expo-asset';

export type MannequinGender = 'male' | 'female';

export type Mannequin = {
    id: string;
    gender: MannequinGender;
    label: string;
    source: number; // result of require(), usable by expo-image
};

export const MANNEQUINS: Mannequin[] = [
    { id: 'male_slim', gender: 'male', label: 'Slim', source: require('../../assets/mannequins/male_slim.jpg') },
    { id: 'male_average', gender: 'male', label: 'Average', source: require('../../assets/mannequins/male_average.jpg') },
    { id: 'male_large', gender: 'male', label: 'Large', source: require('../../assets/mannequins/male_large.jpg') },
    { id: 'female_slim', gender: 'female', label: 'Slim', source: require('../../assets/mannequins/female_slim.jpg') },
    { id: 'female_average', gender: 'female', label: 'Average', source: require('../../assets/mannequins/female_average.jpg') },
    { id: 'female_curvy', gender: 'female', label: 'Curvy', source: require('../../assets/mannequins/female_curvy.jpg') },
];
// Public bucket holding the same six files, named <id>.jpg
const MANNEQUIN_BASE_URL = 'https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>';

const MAX_BYTES = 9 * 1024 * 1024; // YouCam rejects files of 10 MB or more
const cache = new Map<string, string>();

/** Resolves a bundled mannequin image and returns raw base64 (no data: prefix). */
export async function mannequinToBase64(m: Mannequin): Promise<string> {
    const cached = cache.get(m.id);
    if (cached) return cached;

    const asset = Asset.fromModule(m.source);
    if (!asset.localUri) await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) throw new Error('Mannequin image could not be located');

    const isFetchable = /^(https?|file):\/\//i.test(uri);
    const res = await fetch(isFetchable ? uri : `${MANNEQUIN_BASE_URL}/${m.id}.jpg`);
    if (!res.ok) throw new Error(`Could not load the ${m.label} mannequin (${res.status})`);
    const blob = await res.blob();

    const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
            typeof reader.result === 'string'
                ? resolve(reader.result)
                : reject(new Error('Mannequin image data was unreadable'));
        reader.onerror = () => reject(new Error('Could not read the mannequin image'));
        reader.readAsDataURL(blob);
    });

    const base64 = dataUri.split(',')[1];
    if (!base64) throw new Error('Mannequin image is empty');

    const looksPng = base64.startsWith('iVBORw0KGgo');
    const looksJpeg = base64.startsWith('/9j/');
    if (!looksPng && !looksJpeg) throw new Error('Mannequin file is not a valid PNG or JPEG');

    const approxBytes = Math.floor((base64.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
        throw new Error(`Mannequin image is too large (${(approxBytes / 1048576).toFixed(1)} MB)`);
    }

    console.log('[mannequin] prepared', m.id, `${Math.round(approxBytes / 1024)} KB`, looksPng ? 'png' : 'jpeg');
    cache.set(m.id, base64);
    return base64;
}