-- Social Proof Features Database Schema
-- Run this SQL in your Supabase SQL Editor to enable social proof features

-- Create product_views table for tracking product views
CREATE TABLE IF NOT EXISTS public.product_views (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_views
CREATE POLICY "Users can insert their own product views." 
    ON public.product_views FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view product view counts (aggregated)." 
    ON public.product_views FOR SELECT 
    USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON public.product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_product_views_user_product ON public.product_views(user_id, product_id);

-- Function to get current viewers (last 5 minutes)
CREATE OR REPLACE FUNCTION public.get_current_viewers(p_product_id uuid)
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT user_id)
        FROM public.product_views
        WHERE product_id = p_product_id
        AND viewed_at > now() - INTERVAL '5 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_viewers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_viewers(uuid) TO anon;
