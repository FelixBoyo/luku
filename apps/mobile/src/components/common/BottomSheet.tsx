import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { ModalBackdrop } from './ModalBackdrop';

type BottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
};

export const BottomSheet: React.FC<BottomSheetProps> = ({
    visible,
    onClose,
    title,
    children,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <ModalBackdrop onPress={onClose} />
                <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
                    <View style={styles.handle} />
                    {title ? (
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <Pressable onPress={onClose} style={styles.closeBtn}>
                                <X color={colors.text.onDarkMuted} size={18} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                    ) : null}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: 'rgba(10,10,10,0.9)',
        borderTopLeftRadius: radii.xl + 8,
        borderTopRightRadius: radii.xl + 8,
        borderTopWidth: 1,
        borderColor: colors.border.dark,
        paddingHorizontal: spacing.page,
        paddingTop: spacing.md,
        maxHeight: '90%',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
        marginBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
