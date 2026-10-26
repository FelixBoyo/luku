import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MeStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { EditProfileSkeleton } from '../components/skeletons';
import { InfoDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { repositories } from '../repositories';
import type { EditableProfile } from '../repositories/profileRepository';
import { getWardrobeImageUploadUrl, uploadImageToSignedUrl } from '../api/bffUploads';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { isValidHandleFormat, normalizeHandleInput } from '../lib/handle';

type Props = NativeStackScreenProps<MeStackParamList, 'EditProfile'>;

const ALL_STYLES = [
    'Minimalist',
    'Vintage',
    'Bohemian',
    'Streetwear',
    'Elegant',
    'Casual',
    'Sustainable',
    'Formal',
    'Athleisure',
];

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { showToast } = useToast();
    const { refreshSession } = useAuth();
    const [profile, setProfile] = useState<EditableProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [infoDialog, setInfoDialog] = useState<{ title: string; description: string } | null>(
        null,
    );
    const [form, setForm] = useState({
        displayName: '',
        handle: '',
        email: '',
        bio: '',
        location: '',
        website: '',
    });
    const [styles_, setStyles] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        repositories.profile
            .get()
            .then((p) => {
                setProfile(p);
                setAvatarUrl(p.avatarUrl);
                setForm({
                    displayName: p.name,
                    handle: p.handle,
                    email: p.email,
                    bio: p.bio,
                    location: p.location,
                    website: p.website,
                });
                setStyles(p.stylePreferences);
            })
            .catch(() => {
                setInfoDialog({
                    title: 'Could not load profile',
                    description: 'Check your connection and try again.',
                });
            })
            .finally(() => setLoading(false));
    }, []);

    const toggleStyle = (s: string) =>
        setStyles((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
        );

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setInfoDialog({
                title: 'Permission needed',
                description: 'Allow photo library access to upload a profile picture.',
            });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });
        if (result.canceled || !result.assets[0]) return;

        setUploadingAvatar(true);
        try {
            const asset = result.assets[0];
            const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
            const contentType =
                ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            const { signedUrl, publicUrl } = await getWardrobeImageUploadUrl(
                `avatar.${ext}`,
                contentType,
            );
            await uploadImageToSignedUrl(signedUrl, asset.uri, contentType);
            setAvatarUrl(publicUrl);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Upload failed';
            setInfoDialog({ title: 'Could not upload photo', description: message });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        const normalizedHandle = normalizeHandleInput(form.handle);
        if (!normalizedHandle || !isValidHandleFormat(normalizedHandle)) {
            setInfoDialog({
                title: 'Invalid username',
                description:
                    'Username must be 3–20 characters: lowercase letters, numbers, underscores only.',
            });
            return;
        }
        setSaving(true);
        try {
            await repositories.profile.update({
                name: form.displayName.trim() || profile?.name,
                handle: normalizedHandle,
                bio: form.bio.trim(),
                location: form.location.trim(),
                website: form.website.trim(),
                stylePreferences: styles_,
                avatarUrl,
            });
            await refreshSession();
            showToast('Profile updated');
            navigation.goBack();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Save failed';
            setInfoDialog({ title: 'Could not save', description: message });
        } finally {
            setSaving(false);
        }
    };

    const initials = profile?.initials ?? '';

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Edit Profile"
                onBack={() => navigation.goBack()}
                right={
                    <Pressable
                        onPress={() => void handleSave()}
                        style={styles.saveChip}
                        disabled={loading || saving}
                    >
                        <Save color={colors.text.primary} size={14} strokeWidth={2.5} />
                        <Text style={styles.saveChipText}>Save</Text>
                    </Pressable>
                }
            />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <EditProfileSkeleton />
                ) : (
                <>
                <Text style={styles.sectionLabel}>Profile Photo</Text>
                <View style={styles.avatarRow}>
                    <View>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                        ) : (
                        <LinearGradient
                            colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>
                        )}
                        <View style={styles.cameraBadge}>
                            <Camera color={colors.text.primary} size={14} strokeWidth={2.5} />
                        </View>
                    </View>
                    <View>
                        <Pressable
                            style={styles.uploadBtn}
                            onPress={() => void pickAvatar()}
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? (
                                <ActivityIndicator size="small" color={colors.text.primary} />
                            ) : (
                                <Text style={styles.uploadBtnText}>Upload photo</Text>
                            )}
                        </Pressable>
                        <Text style={styles.uploadHint}>PNG, JPG up to 5MB</Text>
                    </View>
                </View>

                {(
                    [
                        { key: 'displayName', label: 'Display name', multiline: false, readOnly: false },
                        { key: 'handle', label: 'Username', multiline: false, readOnly: false },
                        { key: 'email', label: 'Email', multiline: false, readOnly: true },
                        { key: 'bio', label: 'Bio', multiline: true, readOnly: false },
                        { key: 'location', label: 'Location', multiline: false, readOnly: false },
                        { key: 'website', label: 'Website', multiline: false, readOnly: false },
                    ] as const
                ).map((field) => (
                    <View key={field.key} style={styles.field}>
                        <Text style={styles.fieldLabel}>{field.label}</Text>
                        {field.key === 'handle' ? (
                            <View style={styles.handleRow}>
                                <Text style={styles.handlePrefix}>@</Text>
                                <TextInput
                                    value={form.handle.replace(/^@/, '')}
                                    onChangeText={(t) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            handle: t.toLowerCase().replace(/^@/, ''),
                                        }))
                                    }
                                    editable={!field.readOnly}
                                    placeholder="yourname"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={[styles.input, styles.handleInput]}
                                />
                            </View>
                        ) : (
                        <TextInput
                            value={form[field.key]}
                            onChangeText={
                                field.readOnly
                                    ? undefined
                                    : (t) => setForm((prev) => ({ ...prev, [field.key]: t }))
                            }
                            editable={!field.readOnly}
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline={field.multiline}
                            style={[
                                styles.input,
                                field.multiline && styles.inputMultiline,
                                field.readOnly && styles.inputReadOnly,
                            ]}
                        />
                        )}
                        {field.key === 'bio' ? (
                            <Text style={styles.charCount}>
                                {form.bio.length}/150 characters
                            </Text>
                        ) : null}
                    </View>
                ))}

                <Text style={styles.sectionLabel}>Style Preferences</Text>
                <Text style={styles.sectionHint}>
                    Select styles that match your aesthetic
                </Text>
                <View style={styles.chipWrap}>
                    {ALL_STYLES.map((s) => {
                        const active = styles_.includes(s);
                        return (
                            <Pressable
                                key={s}
                                onPress={() => toggleStyle(s)}
                                style={[styles.chip, active && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {s}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Danger Zone</Text>
                    <Pressable style={styles.deleteBtn}>
                        <Text style={styles.deleteBtnText}>Delete Account</Text>
                    </Pressable>
                    <Text style={styles.dangerHint}>This action cannot be undone</Text>
                </View>
                </>
                )}
            </ScrollView>
            <InfoDialog
                visible={infoDialog !== null}
                title={infoDialog?.title ?? ''}
                description={infoDialog?.description ?? ''}
                onClose={() => setInfoDialog(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    content: { padding: spacing.page, paddingBottom: spacing.xxl },
    saveChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radii.md,
    },
    saveChipText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
    },
    sectionHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginBottom: spacing.md,
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarImage: {
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.primary,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.text.onDark,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background.shell,
    },
    uploadBtn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: spacing.sm,
    },
    uploadBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    uploadHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
    },
    field: { marginTop: spacing.lg },
    fieldLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    handleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radii.lg,
        paddingLeft: spacing.lg,
    },
    handlePrefix: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        marginRight: 2,
    },
    handleInput: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingLeft: 0,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radii.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
    inputReadOnly: { opacity: 0.6 },
    charCount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        marginTop: spacing.sm,
    },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    chipActive: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    chipText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDark,
    },
    chipTextActive: { color: colors.text.primary },
    saveBtn: { marginTop: spacing.xxl },
    saveBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: 16,
        borderRadius: radii.lg,
    },
    saveBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dangerZone: {
        marginTop: spacing.xxl,
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dangerTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.lg,
    },
    deleteBtn: {
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.4)',
        backgroundColor: 'rgba(239,68,68,0.15)',
        alignItems: 'center',
    },
    deleteBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: '#F87171',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dangerHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});

export default EditProfileScreen;
