create table if not exists public.site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists internal_note text;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'in_progress', 'contacted', 'waiting_payment', 'ready_for_delivery', 'paid', 'delivered', 'cancelled'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
before update on public.site_content
for each row
execute function public.set_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
to anon
using (true);

insert into public.site_content (key, value)
values
  ('heroTitleLine1', 'תיקים סרוגים בעבודת יד,'),
  ('heroTitleLine2', 'אחד אחד.'),
  ('heroBody', 'דגמים קטנים ושימושיים, עם פרזול יפה, בטנה פנימית ומסירה אישית באזור אשדוד והסביבה.'),
  ('collectionTitle', 'כל תיק מקבל את המקום שלו.'),
  ('trustNote', 'לא משלמים באתר כרגע. אנחנו נחזור אליכם לאישור, תיאום מסירה ותשלום.'),
  ('processBody', 'בוחרים דגם, צבע וחומר, ומשם מכינים את התיק בעבודת יד עד למסירה.')
on conflict (key) do nothing;
