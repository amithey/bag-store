-- Photo framing for bags. Safe to run more than once, and safe to run before or
-- after the matching site update: it only ADDS columns with defaults, so nothing
-- that exists today changes and the site keeps working without it.
--
-- How to run: Supabase Dashboard -> SQL Editor -> paste this -> Run.

alter table public.products
  add column if not exists image_settings jsonb not null default '{}'::jsonb,
  add column if not exists display_mode text not null default 'single',
  add column if not exists pair_layout text not null default 'side';

alter table public.products drop constraint if exists products_display_mode_check;
alter table public.products
  add constraint products_display_mode_check check (display_mode in ('single', 'pair'));

alter table public.products drop constraint if exists products_pair_layout_check;
alter table public.products
  add constraint products_pair_layout_check check (pair_layout in ('side', 'stacked'));

-- image_settings : how each photo of the bag is framed, as JSON keyed by photo URL.
-- display_mode   : 'single' = one photo on the card, 'pair' = the first two together.
-- pair_layout    : for 'pair', 'side' = side by side, 'stacked' = one above the other.
-- The older image_fit column is left in place, but nothing uses it any more.
