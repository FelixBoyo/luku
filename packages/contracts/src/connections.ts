export type ConnectionUserDto = {
    id: string;
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
};

export type FollowRequest = {
    userId: string;
};

export type BlockRequest = {
    userId: string;
};
