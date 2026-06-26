create table if not exists public.products (
  id text primary key,
  name text not null,
  material text not null,
  dimensions text not null,
  price_num integer not null check (price_num > 0),
  image text not null,
  images text[] not null default '{}',
  image_fit text not null default 'cover' check (image_fit in ('cover', 'contain')),
  alt text not null,
  stock_status text not null,
  description text not null,
  category text not null check (category in ('shoulder', 'hand')),
  is_active boolean not null default true,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  city text not null,
  address text not null,
  payment_method text not null,
  payment_label text not null,
  total integer not null check (total >= 0),
  cart_description text not null,
  cart_items jsonb not null default '[]'::jsonb,
  notes text,
  internal_note text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'contacted', 'waiting_payment', 'ready_for_delivery', 'paid', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists images text[] not null default '{}',
  add column if not exists image_fit text not null default 'cover';

alter table public.orders
  add column if not exists internal_note text;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'in_progress', 'contacted', 'waiting_payment', 'ready_for_delivery', 'paid', 'delivered', 'cancelled'));

alter table public.products
  drop constraint if exists products_image_fit_check;

alter table public.products
  add constraint products_image_fit_check check (image_fit in ('cover', 'contain'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
before update on public.site_content
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon
using (is_active = true);

drop policy if exists "Orders are server managed" on public.orders;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
to anon
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects
for select
to anon
using (bucket_id = 'product-images');

insert into public.products
  (id, name, material, dimensions, price_num, image, images, image_fit, alt, stock_status, description, category, is_active, sort_order)
values
  (
    '01',
    'תיק קוקו חום | Coco Brown',
    'חוט טריקו בגוון חום עמוק',
    '23x15 ס״מ',
    150,
    '/images/bag_brown.jpg',
    array['/images/bag_brown.jpg'],
    'cover',
    'תיק סרוג חום עם תליון מוזהב',
    'מוכן למסירה באשדוד והסביבה',
    'תיק צד קטן ונוח בגוון חום עמוק, עם סריגה צפופה ופרזול מוזהב. מתאים ליומיום, לאירוע קטן או כמתנה אישית.',
    'shoulder',
    true,
    10
  ),
  (
    '02',
    'תיק פסים שמנת | Stripes Flap',
    'חוטי כותנה שזורים בגווני שמנת, מוקה וחום',
    '19x12 ס״מ',
    150,
    '/images/bag_pattern.jpg',
    array['/images/bag_pattern.jpg'],
    'cover',
    'תיק סרוג בדוגמת פסים בגווני שמנת וחום',
    'ייצור בהזמנה אישית, כ-7 ימי עבודה',
    'תיק ערב קטן בגווני שמנת וחום, עם אבזם מוזהב ורצועת שרשרת. יש לו נוכחות עדינה בלי להרגיש מוגזם.',
    'shoulder',
    true,
    20
  ),
  (
    '03',
    'תיק אפור מינימל | Slate Grey Mini',
    'חוט פוליאסטר עמיד בגוון אפור עם ברק עדין',
    '22x15 ס״מ',
    200,
    '/images/bag_grey.jpg',
    array['/images/bag_grey.jpg'],
    'cover',
    'תיק צד אפור קומפקטי עם סגירת לשונית',
    'פריט אחרון מוכן למסירה',
    'דגם אפור, קל ונקי שמתאים כמעט לכל הופעה. שימושי ליום יום, ועדיין מרגיש כמו פריט שנבחר בכוונה.',
    'shoulder',
    true,
    30
  ),
  (
    '04',
    'תיק מנטה ידית | Mint Handbag',
    'חוט כותנה רך בגוון ירוק מנטה',
    '24x16 ס״מ',
    350,
    '/images/bag_green.jpg',
    array['/images/bag_green.jpg'],
    'cover',
    'תיק יד סרוג בגוון ירוק מנטה עם ידיות מובנות',
    'ייצור בהזמנה אישית, כ-7 ימי עבודה',
    'תיק יד בגוון מנטה רך, עם ידיות סרוגות ורצועת שרשרת נשלפת. בחירה טובה למי שרוצה צבע עדין אבל לא שגרתי.',
    'hand',
    true,
    40
  ),
  (
    '05',
    'תיק כחול פליסה | Pleated Royal Blue',
    'חוט מקרמה כחול רויאל במבנה פליסה',
    '23x20 ס״מ',
    300,
    '/images/bag_blue.jpg',
    array['/images/bag_blue.jpg'],
    'cover',
    'תיק יד כחול בעיצוב פליסה אנכי',
    'מוכן למסירה באשדוד והסביבה',
    'תיק יד כחול עם קיפולים אנכיים ורצועת שרשרת מוזהבת. הוא בולט, אבל נשאר אלגנטי ונקי.',
    'hand',
    true,
    50
  ),
  (
    '06',
    'תיק לילך מוזהב | Lilac Antler',
    'חוט טריקו בגוון לילך',
    '22x14 ס״מ',
    150,
    '/images/bag_purple.jpg',
    array['/images/bag_purple.jpg'],
    'cover',
    'תיק סרוג לילך עם אבזם מוזהב',
    'פריט יחיד מוכן למסירה באשדוד',
    'תיק כתף רך בגוון לילך, עם אבזם מוזהב ורצועה רחבה. עדין, נוח, ומתאים גם לשעות ארוכות מחוץ לבית.',
    'shoulder',
    true,
    60
  ),
  (
    '07',
    'תיק כסף פליסה | Pleated Silver',
    'חוט מקרמה אפור כסוף עם ברק עדין',
    '22x18 ס״מ',
    300,
    '/images/bag_silver.jpg',
    array['/images/bag_silver.jpg'],
    'cover',
    'תיק יד כסוף בעיצוב פליסה',
    'ייצור בהזמנה אישית, כ-8 ימי עבודה',
    'דגם כסוף עם ידית קשיחה ורצועת שרשרת. מתאים לערב או לאירוע, בלי להרגיש כבד מדי.',
    'hand',
    true,
    70
  )
on conflict (id) do update
set
  name = excluded.name,
  material = excluded.material,
  dimensions = excluded.dimensions,
  price_num = excluded.price_num,
  image = excluded.image,
  images = excluded.images,
  image_fit = excluded.image_fit,
  alt = excluded.alt,
  stock_status = excluded.stock_status,
  description = excluded.description,
  category = excluded.category,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.site_content (key, value)
values
  ('heroTitleLine1', 'תיקים סרוגים בעבודת יד,'),
  ('heroTitleLine2', 'אחד אחד.'),
  ('heroBody', 'דגמים קטנים ושימושיים, עם פרזול יפה, בטנה פנימית ומסירה אישית באזור אשדוד והסביבה.'),
  ('collectionTitle', 'כל תיק מקבל את המקום שלו.'),
  ('trustNote', 'לא משלמים באתר כרגע. אנחנו נחזור אליכם לאישור, תיאום מסירה ותשלום.'),
  ('processBody', 'בוחרים דגם, צבע וחומר, ומשם מכינים את התיק בעבודת יד עד למסירה.')
on conflict (key) do nothing;
