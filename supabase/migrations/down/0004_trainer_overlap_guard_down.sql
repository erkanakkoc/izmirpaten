-- Geri alma: 0004_trainer_overlap_guard.sql
drop trigger if exists lessons_sync_trainer_slots on public.lessons;
drop function if exists public.sync_trainer_slot_booking();
drop index if exists public.lessons_trainer_no_overlap;
