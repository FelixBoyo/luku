import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { repositories } from '../repositories';

// Foreground notifications are silently dropped without a handler — expo-notifications
// logs a warning on every receive otherwise. C-NOTIF-2 is about registering the token,
// not in-app presentation, so this just keeps the default OS banner/sound.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/** EAS project id — required by `getExpoPushTokenAsync`, not yet provisioned. */
const projectId: string | undefined =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ?? Constants.easConfig?.projectId;

/**
 * C-NOTIF-2: register this device's Expo push token after a successful
 * sign-in. Every failure mode here — no physical device, permission denied
 * or not yet asked, no EAS project configured, the network call itself —
 * is swallowed. Sign-in must succeed regardless of push setup, and there is
 * nothing the signed-in user can do about any of these from this screen.
 */
export const registerPushToken = async (): Promise<void> => {
    try {
        if (!Device.isDevice) {
            return; // Simulators/emulators are never issued a push token.
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.DEFAULT,
            });
        }

        const current = await Notifications.getPermissionsAsync();
        let status = current.status;
        if (status !== 'granted' && current.canAskAgain) {
            status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== 'granted') {
            return;
        }

        if (!projectId) {
            return;
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        await repositories.notifications.registerPushToken(token);
    } catch (error) {
        console.warn('[luku/mobile] Push token registration skipped', error);
    }
};
