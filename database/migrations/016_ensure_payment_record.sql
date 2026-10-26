-- 016_ensure_payment_record.sql
-- Checkout used to INSERT into public.payments as the PostgREST client role.
-- That table has RLS on and no INSERT policy, so any connection that is not
-- bypassing RLS is refused with 42501 — after Paystack has already taken the
-- money. create_escrow_order already avoids this by running as postgres
-- (SECURITY DEFINER). This function does the same for the payment row, which
-- was the only remaining checkout write that depended on the client role.
--
-- The amount_minor write after the order RPCs reuses this function: a second
-- call with a positive amount updates the existing row on conflict.

create or replace function public.ensure_payment_record(
    p_buyer_id uuid,
    p_reference text,
    p_provider text default 'paystack',
    p_amount_minor integer default 0,
    p_currency text default 'KES',
    p_status text default 'success'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    if p_buyer_id is null or p_reference is null or length(trim(p_reference)) = 0 then
        raise exception 'buyer_id and reference are required';
    end if;

    -- service_role has auth.uid() = null and skips this. An authenticated
    -- caller (if the gateway presents the secret key that way) may only
    -- record a payment for themselves.
    if auth.uid() is not null and auth.uid() is distinct from p_buyer_id then
        raise exception 'buyer mismatch';
    end if;

    insert into public.payments (
        provider,
        reference,
        buyer_id,
        amount_minor,
        currency,
        status,
        paid_at
    ) values (
        coalesce(nullif(p_provider, ''), 'paystack'),
        trim(p_reference),
        p_buyer_id,
        greatest(coalesce(p_amount_minor, 0), 0),
        coalesce(nullif(p_currency, ''), 'KES'),
        coalesce(nullif(p_status, ''), 'success'),
        now()
    )
    on conflict (reference) do update
        set amount_minor = case
            when excluded.amount_minor > 0 then excluded.amount_minor
            else public.payments.amount_minor
        end
    returning id into v_id;

    return v_id;
end;
$$;

revoke all on function public.ensure_payment_record(uuid, text, text, integer, text, text) from public;
grant execute on function public.ensure_payment_record(uuid, text, text, integer, text, text)
    to service_role, authenticated;
