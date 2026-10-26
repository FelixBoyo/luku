import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        if (__DEV__) console.error('[ErrorBoundary]', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.body}>
                        The app hit an unexpected error. Try again or return home.
                    </Text>
                    <Pressable
                        style={styles.btn}
                        onPress={() => this.setState({ hasError: false })}
                    >
                        <Text style={styles.btnText}>Try Again</Text>
                    </Pressable>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.shell,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 20,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    body: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    btn: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
    },
    btnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
});
