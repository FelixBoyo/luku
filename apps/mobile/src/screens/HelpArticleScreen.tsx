import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpArticle'>;

const HelpArticleScreen: React.FC<Props> = ({ route, navigation }) => {
    const { title, body } = route.params;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Article" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.body}>{body}</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    content: { padding: spacing.page, paddingBottom: spacing.xxl },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.text.onDark,
        marginBottom: spacing.lg,
    },
    body: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 15,
        color: colors.text.onDarkMuted,
        lineHeight: 24,
    },
});

export default HelpArticleScreen;
