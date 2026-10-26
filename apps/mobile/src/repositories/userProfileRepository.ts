import type { UserProfileDto } from '../../../../packages/contracts/src/auth';
import { apiGet } from '../api/apiClient';
import { dtoToEditable, type EditableProfile } from './profileRepository';
import { mockUsers } from '../data/mock/profile';

export type UserProfileRepository = {
    getById: (userId: string) => Promise<EditableProfile>;
};

export const createMockUserProfileRepository = (): UserProfileRepository => ({
    getById: async (userId) => {
        const mock = mockUsers.find((u) => u.id === userId);
        if (mock) {
            return {
                ...mock,
                email: `${userId}@example.com`,
                location: '',
                website: '',
                stylePreferences: [],
            };
        }
        throw new Error('User not found');
    },
});

export const createApiUserProfileRepository = (): UserProfileRepository => ({
    getById: async (userId) => {
        const response = await apiGet<UserProfileDto>(`/v1/api/profile/${userId}`);
        return dtoToEditable(response.data);
    },
});
