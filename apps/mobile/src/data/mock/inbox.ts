export type InboxThread = {
    id: string;
    name: string;
    userId: string;
    preview: string;
    time: string;
    unread: boolean;
    avatarUrl?: string;
    listingProductId?: string;
};

export type Message = {
    id: string;
    text: string;
    sent: boolean;
    time: string;
    createdAt?: string;
};

export const mockInboxThreads: InboxThread[] = [
    {
        id: 'c1',
        name: 'VintageVibes',
        userId: 'vintagevibes',
        preview: 'Yes, the jacket is still available!',
        time: '2m',
        unread: true,
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
        listingProductId: '1',
    },
    {
        id: 'c2',
        name: 'ChicBoutique',
        userId: 'chicboutique',
        preview: 'Your order has been shipped. Track your package...',
        time: '1h',
        unread: true,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        listingProductId: '2',
    },
    {
        id: 'c3',
        name: 'LUKU Support',
        userId: 'lukusupport',
        preview: 'Welcome to LUKU! Here are some tips to get started...',
        time: '3h',
        unread: false,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    },
    {
        id: 'c4',
        name: 'StyleMaven',
        userId: 'stylehaven',
        preview: "Is this item still available? I'd love to...",
        time: '1d',
        unread: false,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        listingProductId: '7',
    },
];

export const mockMessages: Record<string, Message[]> = {
    c1: [
        {
            id: 'm1',
            text: 'Hi! Is the vintage leather jacket still available in size M?',
            sent: true,
            time: '10:30 AM',
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
        {
            id: 'm2',
            text: 'Yes, the jacket is still available!',
            sent: false,
            time: '10:32 AM',
            createdAt: new Date().toISOString(),
        },
    ],
    c2: [
        {
            id: 'm3',
            text: 'When will my order arrive?',
            sent: true,
            time: '9:00 AM',
            createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        },
        {
            id: 'm4',
            text: 'Your order has been shipped.',
            sent: false,
            time: '9:15 AM',
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
    ],
};
