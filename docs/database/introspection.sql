-- LUKU Supabase introspection queries
-- Run in Supabase Dashboard → SQL Editor (dev project).
-- Export each result (CSV or copy) into docs/database/LIVE_INVENTORY.md
-- Date captured: ___________  Project ref: ___________

-- =============================================================================
-- 1. Tables and views (public + auth metadata)
-- =============================================================================
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema IN ('public', 'auth')
  AND table_type IN ('BASE TABLE', 'VIEW')
ORDER BY table_schema, table_name;

-- =============================================================================
-- 2. Columns (public)
-- =============================================================================
SELECT
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- 3. Primary keys
-- =============================================================================
SELECT
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name, kcu.ordinal_position;

-- =============================================================================
-- 4. Foreign keys
-- =============================================================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- 5. Indexes (public)
-- =============================================================================
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- 6. Functions / RPCs (public)
-- =============================================================================
SELECT
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END AS volatility
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY function_name;

-- =============================================================================
-- 7. RLS enabled per table (public)
-- =============================================================================
SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY table_name;

-- =============================================================================
-- 8. RLS policies (public)
-- =============================================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 9. Triggers (public)
-- =============================================================================
SELECT
    event_object_table AS table_name,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY table_name, trigger_name;

-- =============================================================================
-- 10. Storage buckets
-- =============================================================================
SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
ORDER BY name;

-- =============================================================================
-- 11. Storage policies (storage.objects)
-- =============================================================================
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- =============================================================================
-- 12. Extensions
-- =============================================================================
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;

-- =============================================================================
-- 13. Quick health checks (platform gate)
-- =============================================================================
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'search_products_paginated',
      'create_order_with_stock_check'
  );

SELECT count(*) AS active_products
FROM public.products
WHERE is_active = true;

-- =============================================================================
-- 14. Table row counts (public) — optional; can be slow on large tables
-- =============================================================================
SELECT
    relname AS table_name,
    n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC, relname;
