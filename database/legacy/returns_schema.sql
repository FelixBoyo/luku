-- Returns/Refunds Schema
-- Run this SQL in your Supabase SQL Editor to enable returns and refunds

-- Create returns table
CREATE TABLE IF NOT EXISTS public.returns (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'completed')),
    refund_amount decimal(10, 2),
    return_photos text[],
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own returns." 
    ON public.returns FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view returns for their orders." 
    ON public.returns FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.business_accounts ba ON ba.id = o.seller_id
            WHERE o.id = order_id AND ba.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create returns for their orders." 
    ON public.returns FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND buyer_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can update return status." 
    ON public.returns FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.business_accounts ba ON ba.id = o.seller_id
            WHERE o.id = order_id AND ba.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);

-- Trigger for updated_at
CREATE TRIGGER update_returns_updated_at
    BEFORE UPDATE ON public.returns
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
