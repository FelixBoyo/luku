import { Bell, Package, Sparkles, Store } from 'lucide-react-native';
import type { AppNotification } from '../types/domain/notification';
import { mockNotifications } from '../data/mock/notifications';
import { apiGet, apiPost } from '../api/apiClient';
import type { NotificationDto } from '../../../../packages/contracts/src/notifications';

export type NotificationsRepository = {
    list: () => Promise<AppNotification[]>;
    /** C-NOTIF-2: register this device's Expo push token against the signed-in user. */
    registerPushToken: (token: string) => Promise<void>;
};

const mapCategoryToIcon = (category: string) => {
    switch (category) {
        case 'orders':
            return Package;
        case 'style':
            return Sparkles;
        case 'marketplace':
            return Store;
        default:
            return Bell;
    }
};

const mapDtoToDomain = (dto: NotificationDto): AppNotification => ({
    id: dto.id,
    category: dto.category,
    icon: mapCategoryToIcon(dto.category),
    title: dto.title,
    body: dto.body,
    time: dto.time,
    unread: dto.unread,
});

export const createEmptyNotificationsRepository = (): NotificationsRepository => ({
    list: async () => [],
    registerPushToken: async () => {},
});

export const createMockNotificationsRepository = (): NotificationsRepository => ({
    list: async () => [...mockNotifications],
    registerPushToken: async () => {},
});

export const createApiNotificationsRepository = (): NotificationsRepository => ({
    list: async () => {
        const response = await apiGet<NotificationDto[]>('/v1/api/notifications');
        return (response.data ?? []).map(mapDtoToDomain);
    },
    registerPushToken: async (token) => {
        await apiPost('/v1/api/notifications/tokens', { token });
    },
});
