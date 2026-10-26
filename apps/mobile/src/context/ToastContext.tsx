import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme/tokens';

type ToastContextValue = {
    showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const insets = useSafeAreaInsets();
    const [message, setMessage] = useState<string | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback(
        (msg: string) => {
            if (timer.current) clearTimeout(timer.current);
            setMessage(msg);
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.delay(2200),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => setMessage(null));
        },
        [opacity],
    );

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {message ? (
                <Animated.View
                    style={[
                        styles.toast,
                        { bottom: insets.bottom + 80, opacity },
                    ]}
                    pointerEvents="none"
                >
                    <Text style={styles.toastText}>{message}</Text>
                </Animated.View>
            ) : null}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'rgba(30,30,30,0.95)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        maxWidth: '90%',
    },
    toastText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDark,
        textAlign: 'center',
    },
});
