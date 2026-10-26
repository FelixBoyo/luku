import type { LucideIcon } from 'lucide-react-native';

export type NotificationCategory = 'orders' | 'style' | 'marketplace';

export type AppNotification = {
    id: string;
    category: NotificationCategory;
    icon: LucideIcon;
    title: string;
    body: string;
    time: string;
    unread: boolean;
};
