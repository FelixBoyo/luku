import React, { useMemo, useRef } from 'react';
import {
    NativeSyntheticEvent,
    StyleSheet,
    TextInput,
    TextInputKeyPressEventData,
    View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const CODE_LENGTH = 6;

type Props = {
    value: string;
    onChange: (code: string) => void;
    onFocus?: () => void;
};

export const OtpDigitInput: React.FC<Props> = ({ value, onChange, onFocus }) => {
    const inputs = useRef<Array<TextInput | null>>([]);
    const digits = useMemo(() => {
        const chars = value.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
        while (chars.length < CODE_LENGTH) {
            chars.push('');
        }
        return chars;
    }, [value]);

    const focusIndex = (index: number) => {
        inputs.current[index]?.focus();
    };

    const handleChange = (text: string, index: number) => {
        onFocus?.();
        const cleaned = text.replace(/[^0-9]/g, '');

        if (cleaned.length > 1) {
            const next = cleaned.slice(0, CODE_LENGTH).split('');
            while (next.length < CODE_LENGTH) {
                next.push('');
            }
            onChange(next.join('').replace(/\s/g, ''));
            const lastFilled = Math.min(cleaned.length, CODE_LENGTH) - 1;
            focusIndex(Math.max(lastFilled, 0));
            return;
        }

        const next = [...digits];
        next[index] = cleaned;
        onChange(next.join('').replace(/\s/g, ''));
        if (cleaned && index < CODE_LENGTH - 1) {
            focusIndex(index + 1);
        }
    };

    const handleKeyPress = (
        e: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number,
    ) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
            focusIndex(index - 1);
            const next = [...digits];
            next[index - 1] = '';
            onChange(next.join(''));
        }
    };

    return (
        <View style={styles.codeRow}>
            {digits.map((digit, index) => (
                <TextInput
                    key={index}
                    ref={(el) => {
                        inputs.current[index] = el;
                    }}
                    style={[styles.codeBox, digit ? styles.codeBoxFilled : null]}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    returnKeyType="done"
                    selectTextOnFocus
                    autoFocus={index === 0}
                    textContentType="oneTimeCode"
                    accessibilityLabel={`Digit ${index + 1}`}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    codeBox: {
        flex: 1,
        height: 56,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.04)',
        textAlign: 'center',
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.text.cream,
    },
    codeBoxFilled: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
});
