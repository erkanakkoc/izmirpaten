-- Geri alma: 0005_discipline_delete_guard.sql
drop trigger if exists disciplines_prevent_hard_delete on public.disciplines;
drop function if exists public.prevent_discipline_delete_with_dependents();
