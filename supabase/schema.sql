alter table if exists public.saved_items drop constraint if exists saved_items_product_id_fkey;
alter table if exists public.listing_checks drop constraint if exists listing_checks_product_id_fkey;

drop table if exists public.seller_questions cascade;
drop table if exists public.buying_checklist_items cascade;
drop table if exists public.product_issues cascade;
drop table if exists public.products cascade;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
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

create table if not exists public.photo_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  image_paths text[] not null default '{}'::text[],
  product_name text not null,
  price numeric,
  source_label text,
  condition text,
  description text,
  extracted_text text,
  deal_score integer not null check (deal_score between 0 and 100),
  recommendation text not null,
  confidence_score integer not null check (confidence_score between 0 and 100),
  moderation_status text not null default 'needs_review'
    check (moderation_status in ('approved', 'rejected', 'needs_review')),
  visible_in_search boolean not null default false,
  market_price_label text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('buywise-photo-uploads', 'buywise-photo-uploads', false)
on conflict (id) do update set public = false;

alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.listing_checks enable row level security;
alter table public.photo_analyses enable row level security;

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

drop policy if exists "Photo analyses are readable by owner" on public.photo_analyses;
drop policy if exists "Photo analyses are insertable by owner" on public.photo_analyses;
drop policy if exists "Photo analyses are updatable by owner" on public.photo_analyses;
drop policy if exists "Photo analyses are deletable by owner" on public.photo_analyses;

create policy "Photo analyses are readable by owner"
  on public.photo_analyses for select
  using (auth.uid() = user_id);

create policy "Photo analyses are insertable by owner"
  on public.photo_analyses for insert
  with check (auth.uid() = user_id);

create policy "Photo analyses are updatable by owner"
  on public.photo_analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Photo analyses are deletable by owner"
  on public.photo_analyses for delete
  using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.saved_items from anon;
revoke all on table public.listing_checks from anon;
revoke all on table public.photo_analyses from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.saved_items to authenticated;
grant select, insert, update, delete on table public.listing_checks to authenticated;
grant select, insert, update, delete on table public.photo_analyses to authenticated;

create index if not exists saved_items_user_id_created_at_idx
  on public.saved_items (user_id, created_at desc);

create index if not exists listing_checks_user_id_created_at_idx
  on public.listing_checks (user_id, created_at desc);

create index if not exists photo_analyses_feed_idx
  on public.photo_analyses (visible_in_search, moderation_status, expires_at desc, created_at desc);

create index if not exists photo_analyses_user_id_created_at_idx
  on public.photo_analyses (user_id, created_at desc);
