export type InboxThreadDto = {
    id: string;
    name: string;
    userId: string;
    preview: string;
    time: string;
    unread: boolean;
    avatarUrl?: string;
    listingProductId?: string;
};

export type InboxMessageDto = {
    id: string;
    text: string;
    senderId: string;
    sent: boolean;
    time: string;
    createdAt?: string;
};

export type SendMessageRequest = {
    text: string;
};
