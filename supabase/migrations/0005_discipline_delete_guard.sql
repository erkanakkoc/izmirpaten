-- 0005_discipline_delete_guard.sql
-- Branş silinmek yerine pasife alınmalı (is_active=false). İlişkili kayıt varsa
-- hard delete DB seviyesinde de engellenir (uygulama katmanının yanı sıra ikinci savunma hattı).

create or replace function public.prevent_discipline_delete_with_dependents()
returns trigger as $$
begin
    if exists (select 1 from public.packages where discipline_id = old.id)
        or exists (select 1 from public.applications where discipline_id = old.id)
        or exists (select 1 from public.enrollments where discipline_id = old.id)
        or exists (select 1 from public.lessons where discipline_id = old.id)
        or exists (select 1 from public.trainer_slots where discipline_id = old.id)
        or exists (select 1 from public.group_sessions where discipline_id = old.id)
    then
        raise exception 'Bu branşa bağlı kayıtlar var, silinemez. Önce pasife alın (is_active=false).';
    end if;
    return old;
end;
$$ language plpgsql;

create trigger disciplines_prevent_hard_delete
before delete on public.disciplines
for each row execute function public.prevent_discipline_delete_with_dependents();
