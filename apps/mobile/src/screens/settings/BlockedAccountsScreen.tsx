import React, { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/shell/ScreenHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ConnectionRowSkeleton } from '../../components/skeletons';
import { UserX } from 'lucide-react-native';
import type { ConnectionUser } from '../../types/domain/connections';
import type { MeStackParamList } from '../../navigation/types';
import { repositories } from '../../repositories';
import { useToast } from '../../context/ToastContext';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'BlockedAccounts'>;
type LoadState = 'loading' | 'ready' | 'error';

const BlockedAccountsScreen: React.FC<Props> = ({ navigation }) => {
    const { showToast } = useToast();
    const [blocked, setBlocked] = useState<ConnectionUser[]>([]);
    const [loadState, setLoadState] = useState<LoadState>('loading');

    const load = useCallback(async () => {
        setLoadState('loading');
        try {
            const list = await repositories.connections.listBlocked();
            setBlocked(list);
            setLoadState('ready');
        } catch {
            setLoadState('error');
            showToast('Could not load blocked accounts');
        }
    }, [showToast]);

    useEffect(() => {
        load();
    }, [load]);

    const handleUnblock = async (userId: string) => {
        try {
            await repositories.connections.unblock(userId);
            await load();
            showToast('User unblocked');
        } catch {
            showToast('Unblock failed');
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Blocked" onBack={() => navigation.goBack()} />
            {loadState === 'loading' ? (
                <ConnectionRowSkeleton count={4} />
            ) : loadState === 'error' ? (
                <EmptyState
                    icon={UserX}
                    title="Could not load"
                    description="Check your connection and try again"
                />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {blocked.length === 0 ? (
                        <EmptyState
                            icon={UserX}
                            title="No blocked accounts"
                            description="Users you block will appear here"
                        />
                    ) : (
                        blocked.map((u) => (
                            <View key={u.id} style={styles.row}>
                                {u.avatarUrl ? (
                                    <Image
                                        source={{ uri: u.avatarUrl }}
                                        style={styles.avatarImage}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {u.initials}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.flex}>
                                    <Text style={styles.name}>{u.handle}</Text>
                                </View>
                                <Pressable
                                    style={styles.unblock}
                                    onPress={() => void handleUnblock(u.id)}
                                >
                                    <Text style={styles.unblockText}>Unblock</Text>
                                </Pressable>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.sm },
    flex: { flex: 1 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: { width: 40, height: 40, borderRadius: 20 },
    avatarText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
    },
    name: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    handle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    unblock: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    unblockText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
    },
});

export default BlockedAccountsScreen;
