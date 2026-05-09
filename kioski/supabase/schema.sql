-- Kioski mock schema (Supabase Postgres)
-- Apply this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Products (lift ticket master)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_yen integer not null check (price_yen >= 0),
  product_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders (purchase)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  email text not null,
  channel text not null default 'kioski',
  total_yen integer not null check (total_yen >= 0),
  created_at timestamptz not null default now()
);

-- Order items (snapshot)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  unit_price_yen integer not null check (unit_price_yen >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

-- Tickets (1 row per ticket)
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  issued_at timestamptz not null default now(),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tickets_order_id_idx on public.tickets(order_id);
create index if not exists tickets_product_id_idx on public.tickets(product_id);
create index if not exists tickets_used_at_idx on public.tickets(used_at);

-- Redeem (= use) a ticket exactly once.
create or replace function public.redeem_ticket(p_ticket_code text)
returns public.tickets
language plpgsql
as $$
declare
  v_ticket public.tickets;
begin
  update public.tickets
    set used_at = now()
    where ticket_code = p_ticket_code
      and used_at is null
    returning * into v_ticket;

  if not found then
    raise exception 'ticket_not_found_or_already_used';
  end if;

  return v_ticket;
end;
$$;

-- Seed products for the mock UI.
insert into public.products (name, price_yen, product_type, is_active)
values
  ('1日券（大人）', 6500, 'Day', true),
  ('1日券（子供）', 3500, 'Day', true),
  ('午後券（大人）', 4800, 'Afternoon', true),
  ('午後券（子供）', 2500, 'Afternoon', true),
  ('ナイター券（大人）', 3000, 'Night', true),
  ('ナイター券（子供）', 1500, 'Night', true)
on conflict do nothing;

