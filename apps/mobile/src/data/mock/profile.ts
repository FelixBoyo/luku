import type { Profile } from '../../types/domain/profile';

export type { Profile } from '../../types/domain/profile';
/** @deprecated Use Profile */
export type MockProfile = Profile;

export const currentUserProfile: Profile = {
    id: 'me',
    name: 'Shannon Martinez',
    initials: 'SM',
    handle: '@shannonm',
    bio: 'Minimalist style enthusiast · Sustainable fashion advocate',
    followers: 234,
    following: 187,
    listings: 12,
    rating: 4.9,
    verified: true,
};

export const mockUsers: Profile[] = [
    {
        id: 'vintagevibes',
        name: 'VintageVibes',
        initials: 'VV',
        handle: '@vintagevibes',
        bio: 'Curating timeless pieces since 2019. Fast shipping, happy to bundle.',
        followers: 1840,
        following: 92,
        listings: 86,
        rating: 4.9,
        verified: true,
    },
    {
        id: 'urbanstyle',
        name: 'UrbanStyle',
        initials: 'US',
        handle: '@urbanstyle',
        bio: 'Streetwear and modern essentials. DM for offers.',
        followers: 920,
        following: 140,
        listings: 54,
        rating: 4.8,
        verified: false,
    },
    {
        id: 'chicboutique',
        name: 'ChicBoutique',
        initials: 'CB',
        handle: '@chicboutique',
        bio: 'Elevated everyday pieces and coats. Fast, careful shipping.',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        followers: 1320,
        following: 64,
        listings: 124,
        rating: 4.8,
        verified: true,
    },
    {
        id: 'stylehaven',
        name: 'StyleHaven',
        initials: 'SH',
        handle: '@stylehaven',
        bio: 'Top-rated seller. Sneakers, accessories, and finishing touches.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        followers: 2410,
        following: 88,
        listings: 156,
        rating: 5.0,
        verified: true,
    },
    {
        id: 'modernwardrobe',
        name: 'ModernWardrobe',
        initials: 'MW',
        handle: '@modernwardrobe',
        bio: 'Denim, tailoring, and modern basics. Happy to bundle.',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        followers: 740,
        following: 130,
        listings: 62,
        rating: 4.7,
        verified: false,
    },
    {
        id: 'retrocloset',
        name: 'RetroCloset',
        initials: 'RC',
        handle: '@retrocloset',
        bio: 'Curated retro knits and layers. One-of-a-kind finds weekly.',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        followers: 560,
        following: 102,
        listings: 48,
        rating: 4.6,
        verified: false,
    },
];

export const getUserById = (id: string): Profile =>
    mockUsers.find((u) => u.id === id) ?? mockUsers[0];
