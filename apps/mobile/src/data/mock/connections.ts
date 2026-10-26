import { mockUsers } from './profile';

export type ConnectionUser = {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
    initials: string;
};

const toConnection = (u: (typeof mockUsers)[0]): ConnectionUser => ({
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatarUrl: u.avatarUrl,
    initials: u.initials,
});

export const initialFollowers: ConnectionUser[] = mockUsers.map(toConnection);

export const initialFollowing: ConnectionUser[] = [
    ...mockUsers.map(toConnection),
    {
        id: 'stylecurator',
        name: 'Style Curator',
        handle: '@stylecurator',
        initials: 'SC',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    },
    {
        id: 'minimalmuse',
        name: 'Minimal Muse',
        handle: '@minimalmuse',
        initials: 'MM',
    },
    {
        id: 'thriftqueen',
        name: 'Thrift Queen',
        handle: '@thriftqueen',
        initials: 'TQ',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
];
