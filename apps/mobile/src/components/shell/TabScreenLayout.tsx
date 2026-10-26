import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';
import { TopNav } from './TopNav';

type TabScreenLayoutProps = {
    children: React.ReactNode;
    dark?: boolean;
};

export const TabScreenLayout: React.FC<TabScreenLayoutProps> = ({
    children,
    dark = true,
}) => (
    <View
        style={[
            styles.container,
            { backgroundColor: dark ? colors.background.shell : colors.background.app },
        ]}
    >
        <TopNav />
        <View style={styles.content}>{children}</View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
});
