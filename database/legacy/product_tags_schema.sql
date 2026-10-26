-- Product Tags Schema
-- Run this SQL in your Supabase SQL Editor to enable product tagging

-- Create product_tags junction table
CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tag text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, tag)
);

-- Enable RLS
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view product tags." 
    ON public.product_tags FOR SELECT 
    USING (true);

CREATE POLICY "Business owners can manage tags for their products." 
    ON public.product_tags FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.business_accounts ba
            JOIN public.products p ON p.business_id = ba.id
            WHERE p.id = product_id AND ba.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON public.product_tags(tag);

-- View to get products with tags
CREATE OR REPLACE VIEW public.products_with_tags AS
SELECT 
    p.*,
    COALESCE(
        array_agg(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL),
        ARRAY[]::text[]
    ) as tags
FROM public.products p
LEFT JOIN public.product_tags pt ON p.id = pt.product_id
GROUP BY p.id;
