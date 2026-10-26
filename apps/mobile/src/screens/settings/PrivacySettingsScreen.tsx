import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/shell/ScreenHeader';
import { SettingsToggleRow } from '../../components/settings/SettingsToggleRow';
import type { MeStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'PrivacySettings'>;

const PrivacySettingsScreen: React.FC<Props> = ({ navigation }) => {
    const [profilePublic, setProfilePublic] = useState(true);
    const [wardrobeVisible, setWardrobeVisible] = useState(false);
    const [outfitsVisible, setOutfitsVisible] = useState(true);

    return (
        <View style={styles.container}>
            <ScreenHeader title="Privacy" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <SettingsToggleRow
                    label="Public Profile"
                    description="Anyone can view your profile"
                    value={profilePublic}
                    onToggle={() => setProfilePublic((v) => !v)}
                />
                <SettingsToggleRow
                    label="Wardrobe Visibility"
                    description="Show wardrobe items on your profile"
                    value={wardrobeVisible}
                    onToggle={() => setWardrobeVisible((v) => !v)}
                />
                <SettingsToggleRow
                    label="Saved Outfits"
                    description="Allow others to see your outfit inspirations"
                    value={outfitsVisible}
                    onToggle={() => setOutfitsVisible((v) => !v)}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.sm },
});

export default PrivacySettingsScreen;
