import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/shell/ScreenHeader';
import type { MeStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'LanguageRegion'>;

const LANGUAGES = ['English', 'Swahili'];
const REGIONS = ['Kenya (KES)', 'Uganda (UGX)', 'Tanzania (TZS)'];

const LanguageRegionScreen: React.FC<Props> = ({ navigation }) => {
    const [language, setLanguage] = useState('English');
    const [region, setRegion] = useState('Kenya (KES)');

    return (
        <View style={styles.container}>
            <ScreenHeader title="Language & Region" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionLabel}>Language</Text>
                <View style={styles.chips}>
                    {LANGUAGES.map((l) => (
                        <Pressable
                            key={l}
                            style={[styles.chip, language === l && styles.chipActive]}
                            onPress={() => setLanguage(l)}
                        >
                            <Text style={[styles.chipText, language === l && styles.chipTextActive]}>
                                {l}
                            </Text>
                        </Pressable>
                    ))}
                </View>
                <Text style={styles.sectionLabel}>Region & Currency</Text>
                <View style={styles.chips}>
                    {REGIONS.map((r) => (
                        <Pressable
                            key={r}
                            style={[styles.chip, region === r && styles.chipActive]}
                            onPress={() => setRegion(r)}
                        >
                            <Text style={[styles.chipText, region === r && styles.chipTextActive]}>
                                {r}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.md },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: spacing.md,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chipActive: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(72,205,138,0.15)',
    },
    chipText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    chipTextActive: { color: colors.accent.primary },
});

export default LanguageRegionScreen;
