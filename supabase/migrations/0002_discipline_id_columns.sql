-- 0002_discipline_id_columns.sql
-- packages, applications, trainer_slots, lessons, enrollments tablolarına discipline_id eklenir.
-- Mevcut tüm kayıtlar "Tekerlekli Paten" branşına bağlanır, sonra NOT NULL yapılır.

-- packages
alter table public.packages add column discipline_id uuid references public.disciplines(id);
update public.packages
    set discipline_id = (select id from public.disciplines where slug = 'tekerlekli-paten');
alter table public.packages alter column discipline_id set not null;

-- applications
alter table public.applications add column discipline_id uuid references public.disciplines(id);
update public.applications
    set discipline_id = (select id from public.disciplines where slug = 'tekerlekli-paten');
alter table public.applications alter column discipline_id set not null;

-- trainer_slots: eğitmenin branş bazlı müsaitlik aralıkları birbiriyle çakışabilsin diye
-- eski UNIQUE(trainer_id, slot_date, slot_hour) kısıtı, discipline_id dahil edilerek genişletilir.
alter table public.trainer_slots add column discipline_id uuid references public.disciplines(id);
update public.trainer_slots
    set discipline_id = (select id from public.disciplines where slug = 'tekerlekli-paten');
alter table public.trainer_slots alter column discipline_id set not null;

alter table public.trainer_slots
    drop constraint trainer_slots_trainer_id_slot_date_slot_hour_key;
alter table public.trainer_slots
    add constraint trainer_slots_trainer_date_hour_discipline_key
    unique (trainer_id, slot_date, slot_hour, discipline_id);

-- lessons
alter table public.lessons add column discipline_id uuid references public.disciplines(id);
update public.lessons
    set discipline_id = (select id from public.disciplines where slug = 'tekerlekli-paten');
alter table public.lessons alter column discipline_id set not null;

-- enrollments
alter table public.enrollments add column discipline_id uuid references public.disciplines(id);
update public.enrollments
    set discipline_id = (select id from public.disciplines where slug = 'tekerlekli-paten');
alter table public.enrollments alter column discipline_id set not null;

-- filtre/sorgu performansı için index'ler
create index idx_packages_discipline on public.packages(discipline_id);
create index idx_applications_discipline on public.applications(discipline_id);
create index idx_trainer_slots_discipline on public.trainer_slots(discipline_id);
create index idx_lessons_discipline on public.lessons(discipline_id);
create index idx_enrollments_discipline on public.enrollments(discipline_id);
