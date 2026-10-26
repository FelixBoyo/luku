export type Profile = {
    id: string;
    name: string;
    initials: string;
    handle: string;
    bio: string;
    avatarUrl?: string;
    followers: number;
    following: number;
    listings: number;
    rating: number;
    verified: boolean;
};

/** @deprecated Use Profile */
export type MockProfile = Profile;
