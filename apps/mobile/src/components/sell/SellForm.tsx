import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Camera, Tag, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
    getListingImageUploadUrl,
    uploadImageToSignedUrl,
} from '../../api/bffUploads';
import { colors, radii, spacing, typography } from '../../theme/tokens';
export type SellFormValues = {
    title: string;
    brand: string;
    price: string;
    category: string;
    size: string;
    condition: string;
    description: string;
    photoCount: number;
    imageUrl?: string;   // uploaded cover photo URL, if one was picked
};
const CONDITIONS = [
    { label: 'New / Never Worn', desc: 'Tags still on, unused' },
    { label: 'Gently Used', desc: 'Worn a few times, like new' },
    { label: 'Used', desc: 'Regular wear, minor signs' },
    { label: 'Very Worn', desc: 'Visible wear and tear' },
    { label: 'Not Specified', desc: '' },
];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Shoes', 'Accessories', 'Bags'];

type Props = {
    initialValues?: Partial<SellFormValues>;
    wardrobeItemId?: string;
    onSubmit: (values: SellFormValues) => void;
    onDraft?: () => void;
    showDraft?: boolean;
    submitting?: boolean; 
};

export const SellForm: React.FC<Props> = ({
    initialValues,
    onSubmit,
    onDraft,
    showDraft = true,
    submitting = false,
}) => {
    const [photoCount, setPhotoCount] = useState(initialValues?.photoCount ?? 0);
    const [condition, setCondition] = useState(initialValues?.condition ?? '');
    const [size, setSize] = useState(initialValues?.size ?? '');
    const [category, setCategory] = useState(initialValues?.category ?? '');
    const [title, setTitle] = useState(initialValues?.title ?? '');
    const [brand, setBrand] = useState(initialValues?.brand ?? '');
    const [price, setPrice] = useState(initialValues?.price ?? '');
    const [description, setDescription] = useState(initialValues?.description ?? '');
    const [pickedImage, setPickedImage] = useState<{
        uri: string;
        type: string;
        name: string;
    } | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
            const contentType =
                ext === 'png' ? 'image/png'
                : ext === 'webp' ? 'image/webp'
                : 'image/jpeg';
            setPickedImage({ uri: asset.uri, type: contentType, name: `photo.${ext}` });
            setPhotoCount((c) => Math.max(c, 1));
        }
    };

const [submitted, setSubmitted] = useState(false);

const handleSubmitPress = async () => {
    if (submitted || submitting) return;   // guard against double-tap
    setSubmitted(true);

    let imageUrl: string | undefined;
    if (pickedImage) {
        setUploading(true);
        try {
            const { signedUrl, publicUrl } = await getListingImageUploadUrl(
                pickedImage.name,
                pickedImage.type,
            );
            await uploadImageToSignedUrl(signedUrl, pickedImage.uri, pickedImage.type);
            imageUrl = publicUrl;
        } catch (err) {
            Alert.alert('Upload failed', err instanceof Error ? err.message : 'Could not upload photo');
            setUploading(false);
            setSubmitted(false);   // allow retry on failure
            return;
        }
        setUploading(false);
    }
    onSubmit({ title, brand, price, category, size, condition, description, photoCount, imageUrl });
};

    const addPhoto = () => setPhotoCount((c) => Math.min(c + 1, 8));

    return (
        <View>
            <View style={styles.section}>
                <Text style={styles.label}>Photos</Text>
                <View style={styles.photoGrid}>
                    <Pressable style={styles.photoMain} onPress={() => void pickImage()}>
                        {pickedImage ? (
                            <Image
                                source={{ uri: pickedImage.uri }}
                                style={StyleSheet.absoluteFill}
                                contentFit="cover"
                            />
                        ) : (
                            <>
                                <View style={styles.uploadCircle}>
                                    <Upload size={20} color={colors.text.onDarkMuted} strokeWidth={2} />
                                </View>
                                <Text style={styles.photoLabel}>Add Cover Photo</Text>
                            </>
                        )}
                    </Pressable>
                    <View style={styles.photoColumn}>
                        {[0, 1, 2].map((i) => (
                            <Pressable key={i} style={styles.photoSmall} onPress={addPhoto}>
                                <Camera size={16} color={colors.text.onDarkSubtle} strokeWidth={1.5} />
                            </Pressable>
                        ))}
                    </View>
                </View>
                <Text style={styles.helper}>
                    {photoCount > 0
                        ? `${photoCount} photo(s) added · First photo is the cover`
                        : 'Add up to 8 photos · First photo is the cover'}
                </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.label}>Item Details</Text>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Vintage Leather Jacket"
                    placeholderTextColor={colors.text.onDarkSubtle}
                    value={title}
                    onChangeText={setTitle}
                />
                <Text style={styles.fieldLabel}>Designer / Brand</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Zara, Gucci, No Brand"
                    placeholderTextColor={colors.text.onDarkSubtle}
                    value={brand}
                    onChangeText={setBrand}
                />
                <Text style={styles.fieldLabel}>Price (KES)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.text.onDarkSubtle}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                />

                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.chips}>
                    {CATEGORIES.map((c) => (
                        <Pressable
                            key={c}
                            style={[styles.chip, category === c && styles.chipActive]}
                            onPress={() => setCategory(c)}
                        >
                            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                                {c}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.fieldLabel}>Size</Text>
                <View style={styles.chips}>
                    {SIZES.map((s) => (
                        <Pressable
                            key={s}
                            style={[styles.chip, size === s && styles.chipActive]}
                            onPress={() => setSize(s)}
                        >
                            <Text style={[styles.chipText, size === s && styles.chipTextActive]}>
                                {s}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Describe the item — measurements, fabric, color, flaws…"
                    placeholderTextColor={colors.text.onDarkSubtle}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.label}>Condition</Text>
                <View style={styles.conditionList}>
                    {CONDITIONS.map((c) => {
                        const active = condition === c.label;
                        return (
                            <Pressable
                                key={c.label}
                                style={[styles.conditionRow, active && styles.conditionActive]}
                                onPress={() => setCondition(c.label)}
                            >
                                <View style={styles.flex}>
                                    <Text style={[styles.conditionLabel, active && styles.conditionLabelActive]}>
                                        {c.label}
                                    </Text>
                                    {c.desc ? (
                                        <Text style={styles.conditionDesc}>{c.desc}</Text>
                                    ) : null}
                                </View>
                                <View style={[styles.radio, active && styles.radioActive]}>
                                    {active ? <View style={styles.radioDot} /> : null}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View style={styles.actions}>
                {showDraft && onDraft ? (
                    <Pressable style={styles.draftBtn} onPress={onDraft}>
                        <Text style={styles.draftText}>Save Draft</Text>
                    </Pressable>
                ) : null}
            <Pressable
                style={[styles.listBtn, !showDraft && styles.listBtnFull]}
                disabled={submitted || submitting || uploading}
                onPress={() => void handleSubmitPress()}
            >
                <Tag size={16} color={colors.text.primary} strokeWidth={2.5} />
                <Text style={styles.listText}>
                    {uploading ? 'Uploading…' : submitting ? 'Listing…' : 'List Item'}
                </Text>
            </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    section: { paddingHorizontal: spacing.page, marginTop: spacing.xl },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: spacing.md,
    },
    photoGrid: { flexDirection: 'row', gap: spacing.sm },
    photoMain: {
        flex: 2,
        aspectRatio: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        overflow: 'hidden',   // ← add this
    },
    uploadCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkMuted,
    },
    photoColumn: { flex: 1, gap: spacing.sm },
    photoSmall: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helper: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        marginTop: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.dark,
        marginHorizontal: spacing.page,
        marginTop: spacing.xl,
    },
    fieldLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    textarea: { minHeight: 90, textAlignVertical: 'top' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chipActive: {
        borderColor: colors.accent.primary,
        backgroundColor: colors.accent.primary,
    },
    chipText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    chipTextActive: { color: colors.text.primary },
    conditionList: { gap: spacing.sm },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    conditionActive: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(72,205,138,0.07)',
    },
    conditionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    conditionLabelActive: { color: colors.accent.primary },
    conditionDesc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: { borderColor: colors.accent.primary },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent.primary,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.page,
        marginTop: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    draftBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    draftText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    listBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.accent.primary,
    },
    listBtnFull: { flex: 1 },
    listText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    disabledBtn: {
    opacity: 0.5, 
    }
});

export const wardrobeToSellValues = (
    item: {
        name: string;
        brand: string;
        category: string;
        size: string;
        condition: string;
        description?: string;
        images?: string[];
    },
): Partial<SellFormValues> => ({
    title: item.name,
    brand: item.brand,
    category: item.category,
    size: item.size,
    condition: item.condition,
    description: item.description ?? '',
    photoCount: item.images?.length ?? 1,
});
