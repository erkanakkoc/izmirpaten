-- Geri alma: 0002_discipline_id_columns.sql
drop index if exists public.idx_enrollments_discipline;
drop index if exists public.idx_lessons_discipline;
drop index if exists public.idx_trainer_slots_discipline;
drop index if exists public.idx_applications_discipline;
drop index if exists public.idx_packages_discipline;

alter table public.enrollments drop column if exists discipline_id;
alter table public.lessons drop column if exists discipline_id;

alter table public.trainer_slots
    drop constraint if exists trainer_slots_trainer_date_hour_discipline_key;
alter table public.trainer_slots
    add constraint trainer_slots_trainer_id_slot_date_slot_hour_key
    unique (trainer_id, slot_date, slot_hour);
alter table public.trainer_slots drop column if exists discipline_id;

alter table public.applications drop column if exists discipline_id;
alter table public.packages drop column if exists discipline_id;
