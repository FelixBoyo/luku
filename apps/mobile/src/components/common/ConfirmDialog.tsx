import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { ModalBackdrop } from './ModalBackdrop';

type ConfirmDialogProps = {
    visible: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    loading = false,
    onConfirm,
    onCancel,
}) => (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={loading ? undefined : onCancel}
        statusBarTranslucent
    >
        <View style={styles.backdrop}>
            <ModalBackdrop />
            <View style={styles.card}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                <View style={styles.actions}>
                    <Pressable
                        style={[styles.cancelBtn, loading && styles.btnDisabled]}
                        onPress={loading ? undefined : onCancel}
                        disabled={loading}
                    >
                        <Text style={styles.cancelText}>{cancelLabel}</Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.confirmBtn,
                            destructive && styles.confirmBtnDestructive,
                            loading && styles.btnDisabled,
                        ]}
                        onPress={loading ? undefined : onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.text.onDark} size="small" />
                        ) : (
                            <Text style={styles.confirmText}>{confirmLabel}</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    </Modal>
);

type InfoDialogProps = {
    visible: boolean;
    title: string;
    description: string;
    okLabel?: string;
    onClose: () => void;
};

export const InfoDialog: React.FC<InfoDialogProps> = ({
    visible,
    title,
    description,
    okLabel = 'OK',
    onClose,
}) => (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
    >
        <View style={styles.backdrop}>
            <ModalBackdrop />
            <View style={styles.card}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                <Pressable style={[styles.confirmBtn, styles.infoOkBtn]} onPress={onClose}>
                    <Text style={styles.confirmText}>{okLabel}</Text>
                </Pressable>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.page,
    },
    card: {
        width: '100%',
        padding: spacing.xl,
        borderRadius: radii.xl,
        backgroundColor: 'rgba(26,26,26,0.82)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    description: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: spacing.xl,
        lineHeight: 20,
    },
    actions: { flexDirection: 'row', gap: spacing.md },
    cancelBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    cancelText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnDestructive: {
        backgroundColor: colors.status.error,
    },
    btnDisabled: { opacity: 0.5 },
    infoOkBtn: { flex: undefined, width: '100%' },
    confirmText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
});