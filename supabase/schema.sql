create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  category text not null,
  brand text not null,
  model text not null,
  year integer not null,
  msrp numeric not null,
  used_low numeric not null,
  used_avg numeric not null,
  used_high numeric not null,
  fair_price numeric not null,
  depreciation_percent numeric not null,
  reliability_score integer not null check (reliability_score between 1 and 10),
  demand_score integer not null check (demand_score between 1 and 10),
  scam_risk_score integer not null check (scam_risk_score between 1 and 10),
  recommendation text not null,
  recommendation_explanation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_issues (
  id bigint generated always as identity primary key,
  product_id text not null references public.products(id) on delete cascade,
  issue text not null,
  severity text not null check (severity in ('low', 'medium', 'high'))
);

create table if not exists public.buying_checklist_items (
  id bigint generated always as identity primary key,
  product_id text not null references public.products(id) on delete cascade,
  checklist_item text not null
);

create table if not exists public.seller_questions (
  id bigint generated always as identity primary key,
  product_id text not null references public.products(id) on delete cascade,
  question text not null
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  asking_price numeric not null,
  marketplace text not null,
  seller_location text,
  notes text,
  status text not null default 'watching'
    check (status in ('watching', 'contacted', 'negotiating', 'bought', 'passed')),
  created_at timestamptz not null default now()
);

create table if not exists public.listing_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id text not null,
  asking_price numeric not null,
  condition text not null,
  description text,
  marketplace text not null,
  deal_score integer not null,
  risk_level text not null,
  confidence_score integer,
  price_difference numeric,
  red_flags jsonb not null default '[]'::jsonb,
  positive_signals jsonb not null default '[]'::jsonb,
  suggested_offer_low numeric not null,
  suggested_offer_high numeric not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.listing_checks enable row level security;

alter table public.saved_items drop constraint if exists saved_items_product_id_fkey;
alter table public.listing_checks drop constraint if exists listing_checks_product_id_fkey;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Saved items are owned by user" on public.saved_items;
drop policy if exists "Saved items are readable by owner" on public.saved_items;
drop policy if exists "Saved items are insertable by owner" on public.saved_items;
drop policy if exists "Saved items are updatable by owner" on public.saved_items;
drop policy if exists "Saved items are deletable by owner" on public.saved_items;

create policy "Saved items are readable by owner"
  on public.saved_items for select
  using (auth.uid() = user_id);

create policy "Saved items are insertable by owner"
  on public.saved_items for insert
  with check (auth.uid() = user_id);

create policy "Saved items are updatable by owner"
  on public.saved_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Saved items are deletable by owner"
  on public.saved_items for delete
  using (auth.uid() = user_id);

drop policy if exists "Listing checks are owned by user" on public.listing_checks;
create policy "Listing checks are owned by user"
  on public.listing_checks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

grant select on table public.products to anon, authenticated;
grant select on table public.product_issues to anon, authenticated;
grant select on table public.buying_checklist_items to anon, authenticated;
grant select on table public.seller_questions to anon, authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.saved_items from anon;
revoke all on table public.listing_checks from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.saved_items to authenticated;
grant select, insert, update, delete on table public.listing_checks to authenticated;

create index if not exists saved_items_user_id_created_at_idx
  on public.saved_items (user_id, created_at desc);

create index if not exists listing_checks_user_id_created_at_idx
  on public.listing_checks (user_id, created_at desc);
