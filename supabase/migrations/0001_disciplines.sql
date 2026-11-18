-- 0001_disciplines.sql
-- Çoklu branş desteği: temel disciplines tablosu + eğitmen/lokasyon ilişki tabloları.
-- Mevcut veriyi SİLMEZ; mevcut tüm eğitmen/lokasyon kayıtları "Tekerlekli Paten" branşına bağlanır.

create table public.disciplines (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    description text,
    icon text,
    cover_image_url text,
    lesson_duration_minutes integer not null default 40,
    max_group_size integer not null default 5,
    equipment_note text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamp with time zone default now()
);

create table public.trainer_disciplines (
    trainer_id uuid not null references public.trainers(id) on delete cascade,
    discipline_id uuid not null references public.disciplines(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (trainer_id, discipline_id)
);

create table public.location_disciplines (
    location_id uuid not null references public.locations(id) on delete cascade,
    discipline_id uuid not null references public.disciplines(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (location_id, discipline_id)
);

-- Seed: mevcut tek branş "Tekerlekli Paten" (aktif) + "Buz Pateni" (pasif, admin dolduracak)
insert into public.disciplines
    (name, slug, description, icon, lesson_duration_minutes, max_group_size, is_active, sort_order)
values
    ('Tekerlekli Paten', 'tekerlekli-paten', 'İzmir''de açık havada tekerlekli paten dersleri.', 'Zap', 40, 5, true, 0),
    ('Buz Pateni', 'buz-pateni', null, 'Snowflake', 30, 5, false, 1);

-- Mevcut tüm eğitmenleri tekerlekli paten branşına ata
insert into public.trainer_disciplines (trainer_id, discipline_id)
select t.id, d.id
from public.trainers t
cross join (select id from public.disciplines where slug = 'tekerlekli-paten') d;

-- Mevcut tüm lokasyonları tekerlekli paten branşına ata
insert into public.location_disciplines (location_id, discipline_id)
select l.id, d.id
from public.locations l
cross join (select id from public.disciplines where slug = 'tekerlekli-paten') d;

-- RLS
alter table public.disciplines enable row level security;
alter table public.trainer_disciplines enable row level security;
alter table public.location_disciplines enable row level security;

create policy "Public read active disciplines" on public.disciplines
    for select using (is_active = true);
create policy "Admin full access disciplines" on public.disciplines
    using (auth.role() = 'authenticated');

create policy "Auth access trainer_disciplines" on public.trainer_disciplines
    using (auth.role() = 'authenticated');

create policy "Public read location_disciplines" on public.location_disciplines
    for select using (true);
create policy "Admin full access location_disciplines" on public.location_disciplines
    using (auth.role() = 'authenticated');
