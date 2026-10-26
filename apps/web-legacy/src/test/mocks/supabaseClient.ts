import { vi } from 'vitest';

// Mock environment variables before importing supabaseClient
process.env.SUPABASE_PROJECT_ID = 'test-project-id';
process.env.SUPABASE_ANON_KEY = 'test-anon-key-12345678901234567890';

// Mock Supabase client
export const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    gte: vi.fn(() => mockSupabase),
    lte: vi.fn(() => mockSupabase),
    or: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    auth: {
        getSession: vi.fn(),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
    },
};

// Mock the supabase client module
vi.mock('../../services/supabaseClient', async () => {
    // Set env vars before importing
    process.env.SUPABASE_PROJECT_ID = 'test-project-id';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key-12345678901234567890';
    
    return {
        supabase: mockSupabase,
        isSupabaseConfigured: true,
        ENABLE_DEV_BYPASS: false,
    };
});
