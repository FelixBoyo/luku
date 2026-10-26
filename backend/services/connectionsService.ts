import type { ConnectionUserDto } from '../../packages/contracts/src/connections';
import {
    blockUser,
    followUser,
    listBlocked,
    listFollowers,
    listFollowing,
    unfollowUser,
    unblockUser,
} from '../data/connectionsData';

export const getFollowers = (userId: string): Promise<ConnectionUserDto[]> =>
    listFollowers(userId);

export const getFollowing = (userId: string): Promise<ConnectionUserDto[]> =>
    listFollowing(userId);

export const follow = (followerId: string, followingId: string): Promise<void> =>
    followUser(followerId, followingId);

export const unfollow = (followerId: string, followingId: string): Promise<void> =>
    unfollowUser(followerId, followingId);

export const block = (blockerId: string, blockedId: string): Promise<void> =>
    blockUser(blockerId, blockedId);

export const unblock = (blockerId: string, blockedId: string): Promise<void> =>
    unblockUser(blockerId, blockedId);

export const getBlocked = (userId: string): Promise<ConnectionUserDto[]> =>
    listBlocked(userId);
