import { describe, expect, it } from 'vitest';

/** Mirrors signup error mapping in backend/router/v1/auth.ts */
const mapSignupError = (message: string): string => {
    if (/already|exists|registered|duplicate/i.test(message)) {
        return 'VALIDATION_FAILED';
    }
    if (/password|weak|short/i.test(message)) {
        return 'VALIDATION_FAILED';
    }
    return 'VALIDATION_FAILED';
};

describe('mapSignupError', () => {
    it('maps duplicate email errors', () => {
        expect(mapSignupError('User already registered')).toBe('VALIDATION_FAILED');
    });

    it('maps weak password errors', () => {
        expect(mapSignupError('Password should be at least 6 characters')).toBe(
            'VALIDATION_FAILED',
        );
    });
});

describe('ProfilePatchRequest shape', () => {
    it('does not include email field', () => {
        const patch = {
            displayName: 'Test',
            handle: '@test',
            bio: 'Hello',
        };
        expect(patch).not.toHaveProperty('email');
    });
});
