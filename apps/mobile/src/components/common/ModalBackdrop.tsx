import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

type Props = {
    onPress?: () => void;
};

/**
 * Full-screen modal backdrop. iOS blurs what is underneath and dims it; Android
 * blur inside a `Modal` needs a blur target we do not have, so it falls back
 * to a darker plain overlay to keep foreground text legible.
 */
export const ModalBackdrop: React.FC<Props> = ({ onPress }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents={onPress ? 'auto' : 'none'}>
        {Platform.OS === 'ios' ? (
            <>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, styles.dimIos]} />
            </>
        ) : (
            <View style={[StyleSheet.absoluteFill, styles.dimAndroid]} />
        )}
        {onPress ? <Pressable style={StyleSheet.absoluteFill} onPress={onPress} /> : null}
    </View>
);

const styles = StyleSheet.create({
    dimIos: { backgroundColor: 'rgba(0,0,0,0.45)' },
    dimAndroid: { backgroundColor: 'rgba(0,0,0,0.78)' },
});
