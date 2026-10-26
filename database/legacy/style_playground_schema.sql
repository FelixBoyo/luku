-- Style Playground Database Schema
-- Run this in your Supabase SQL Editor

-- Create style_playground_sessions table
CREATE TABLE IF NOT EXISTS style_playground_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create style_queries table
CREATE TABLE IF NOT EXISTS style_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES style_playground_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    ai_prompt TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create style_customizations table
CREATE TABLE IF NOT EXISTS style_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES style_queries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customization_type TEXT NOT NULL CHECK (customization_type IN ('style_fusion', 'color_palette', 'occasion', 'intensity')),
    customization_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON style_playground_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON style_playground_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_session_id ON style_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_queries_user_id ON style_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON style_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customizations_query_id ON style_customizations(query_id);
CREATE INDEX IF NOT EXISTS idx_customizations_user_id ON style_customizations(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE style_playground_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_customizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for style_playground_sessions
CREATE POLICY "Users can view their own sessions"
    ON style_playground_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
    ON style_playground_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON style_playground_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON style_playground_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for style_queries
CREATE POLICY "Users can view their own queries"
    ON style_queries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own queries"
    ON style_queries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queries"
    ON style_queries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queries"
    ON style_queries FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for style_customizations
CREATE POLICY "Users can view their own customizations"
    ON style_customizations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customizations"
    ON style_customizations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customizations"
    ON style_customizations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customizations"
    ON style_customizations FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on sessions
DROP TRIGGER IF EXISTS update_sessions_updated_at ON style_playground_sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON style_playground_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
