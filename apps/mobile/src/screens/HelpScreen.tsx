import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    BookOpen,
    ChevronRight,
    Mail,
    MessageCircle,
    Search,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

const categories = [
    { id: '1', name: 'Getting Started', count: 8 },
    { id: '2', name: 'Wardrobe & Outfits', count: 12 },
    { id: '3', name: 'Shopping & Orders', count: 10 },
    { id: '4', name: 'Account Settings', count: 6 },
    { id: '5', name: 'Selling on LUKU', count: 15 },
    { id: '6', name: 'Sustainability', count: 5 },
];

const popularArticles = [
    { id: '1', title: 'How to add items to your wardrobe', category: 'Getting Started' },
    { id: '2', title: 'Creating your first outfit', category: 'Wardrobe & Outfits' },
    { id: '3', title: 'Understanding your Style DNA', category: 'Getting Started' },
    { id: '4', title: 'How to track your orders', category: 'Shopping & Orders' },
    { id: '5', title: 'Setting up M-Pesa payments', category: 'Shopping & Orders' },
];

const contactOptions = [
    { id: 'email', icon: Mail, title: 'Email Support', sub: 'Response within 24 hours' },
    { id: 'chat', icon: MessageCircle, title: 'Live Chat', sub: 'Available Mon-Fri 9AM-5PM' },
];

const HelpScreen: React.FC<Props> = ({ navigation }) => {
    const [query, setQuery] = useState('');

    return (
        <View style={styles.container}>
            <ScreenHeader title="Help Center" onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>HELP CENTER</Text>
                    <View style={styles.underline} />
                    <Text style={styles.subtitle}>Find answers and get support</Text>
                </View>

                <View style={styles.searchWrap}>
                    <Search color="rgba(255,255,255,0.4)" size={18} strokeWidth={2.5} style={styles.searchIcon} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search for help..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        style={styles.searchInput}
                    />
                </View>

                <Text style={styles.sectionTitle}>Browse By Topic</Text>
                <View style={styles.list}>
                    {categories.map((cat) => (
                        <Pressable
                            key={cat.id}
                            style={styles.catRow}
                            onPress={() =>
                                navigation.navigate('HelpArticle', {
                                    title: cat.name,
                                    body: `Browse ${cat.count} articles about ${cat.name.toLowerCase()}. Full help content will be available in a future update.`,
                                })
                            }
                        >
                            <View style={styles.catIcon}>
                                <BookOpen color={colors.accent.primary} size={20} strokeWidth={2.5} />
                            </View>
                            <View style={styles.flex}>
                                <Text style={styles.catName}>{cat.name}</Text>
                                <Text style={styles.catCount}>{cat.count} articles</Text>
                            </View>
                            <ChevronRight color="rgba(255,255,255,0.4)" size={20} strokeWidth={2.5} />
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Popular Articles</Text>
                <View style={styles.list}>
                    {popularArticles.map((article) => (
                        <Pressable
                            key={article.id}
                            style={styles.articleRow}
                            onPress={() =>
                                navigation.navigate('HelpArticle', {
                                    title: article.title,
                                    body: `This article covers ${article.title.toLowerCase()} in the ${article.category} section.`,
                                })
                            }
                        >
                            <Text style={styles.articleTitle}>{article.title}</Text>
                            <Text style={styles.articleCat}>{article.category}</Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Contact Support</Text>
                <View style={styles.list}>
                    {contactOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                            <Pressable
                                key={opt.id}
                                style={styles.contactRow}
                                onPress={() => navigation.navigate('ComingSoon', { feature: opt.title })}
                            >
                                <View style={styles.contactIcon}>
                                    <Icon color={colors.accent.primary} size={22} strokeWidth={2.5} />
                                </View>
                                <View style={styles.flex}>
                                    <Text style={styles.contactTitle}>{opt.title}</Text>
                                    <Text style={styles.contactSub}>{opt.sub}</Text>
                                </View>
                                <ChevronRight color="rgba(255,255,255,0.4)" size={20} strokeWidth={2.5} />
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.appInfo}>
                    <Text style={styles.version}>LUKU v1.0.0</Text>
                    <View style={styles.legalRow}>
                        <Pressable onPress={() => navigation.navigate('Legal', { tab: 'terms' })}>
                            <Text style={styles.legalLink}>Terms of Service</Text>
                        </Pressable>
                        <Text style={styles.legalDot}>·</Text>
                        <Pressable onPress={() => navigation.navigate('Legal', { tab: 'privacy' })}>
                            <Text style={styles.legalLink}>Privacy Policy</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl },
    flex: { flex: 1 },
    header: { marginBottom: spacing.lg },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 32,
        color: colors.text.onDark,
        letterSpacing: -0.5,
    },
    underline: {
        width: 140,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.accent.primary,
        marginTop: 2,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: spacing.md,
    },
    searchWrap: { marginBottom: spacing.xl },
    searchIcon: { position: 'absolute', left: 16, top: 16, zIndex: 1 },
    searchInput: {
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radii.lg,
        paddingVertical: spacing.md + 2,
        paddingLeft: 44,
        paddingRight: spacing.lg,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    list: { gap: spacing.sm, marginBottom: spacing.xl },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    catIcon: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: 'rgba(72,205,138,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    catName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    catCount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    articleRow: {
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    articleTitle: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
        marginBottom: 2,
    },
    articleCat: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(72,205,138,0.3)',
        backgroundColor: 'rgba(72,205,138,0.08)',
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    contactSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    appInfo: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
    version: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    legalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    legalLink: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    legalDot: { color: 'rgba(255,255,255,0.4)' },
});

export default HelpScreen;
