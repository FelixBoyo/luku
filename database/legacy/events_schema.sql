-- Behavioral Events Table for LUKU Analytics
-- Run this SQL in your Supabase SQL Editor to enable event-level analytics.

CREATE TABLE IF NOT EXISTS public.events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    session_id text,
    event_name text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    properties jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policies:
-- Authenticated users can insert their own events.
CREATE POLICY "Users can insert their own events"
    ON public.events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Aggregated reads are allowed for authenticated users to power dashboards.
CREATE POLICY "Authenticated users can read events"
    ON public.events
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events (user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events (event_name);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON public.events (occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events (session_id);

