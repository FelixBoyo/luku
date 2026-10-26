export type NotificationCategoryDto = 'orders' | 'style' | 'marketplace';

export type NotificationDto = {
    id: string;
    category: NotificationCategoryDto;
    title: string;
    body: string;
    time: string;
    unread: boolean;
};
