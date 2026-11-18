-- 0004_trainer_overlap_guard.sql
-- ADIM 3 kuralı: bir eğitmenin TEK takvimi vardır, branşlar bu takvimi paylaşır.
--
-- Not: Görev metni tstzrange + btree_gist EXCLUDE constraint öneriyordu, ancak mevcut
-- mimari saatlik ızgara kullanıyor (trainer_slots: slot_date + slot_hour, UNIQUE kısıtı;
-- her rezervasyon tam 1 saat kaplar, duration_minutes yalnızca bilgi amaçlı). Bu nedenle
-- eşdeğer garanti, scheduled_at üzerinde kısmi (partial) bir UNIQUE index ile sağlanıyor:
-- bir eğitmenin aynı saatte (branş fark etmeksizin) yalnızca tek bir aktif (pending/approved)
-- dersi olabilir. Europe/Istanbul saat dilimi varsayılır (scheduled_at timestamptz olarak
-- saklanıyor, uygulama katmanı bu alanı Europe/Istanbul'a göre üretiyor).
create unique index lessons_trainer_no_overlap
    on public.lessons (trainer_id, scheduled_at)
    where status in ('pending', 'approved');

-- Bir dersin (bireysel ya da grup) durumu pending/approved olduğunda, o eğitmenin
-- o tarih+saatteki TÜM branşlardaki trainer_slots kayıtları "dolu" (is_booked=true)
-- işaretlenir; ders iptal olduğunda veya silindiğinde serbest bırakılır.
create or replace function public.sync_trainer_slot_booking()
returns trigger as $$
declare
    v_trainer_id uuid;
    v_slot_date date;
    v_slot_hour integer;
    v_still_active boolean;
begin
    v_trainer_id := coalesce(new.trainer_id, old.trainer_id);

    if v_trainer_id is null then
        return coalesce(new, old);
    end if;

    v_slot_date := (coalesce(new.scheduled_at, old.scheduled_at) at time zone 'Europe/Istanbul')::date;
    v_slot_hour := extract(hour from (coalesce(new.scheduled_at, old.scheduled_at) at time zone 'Europe/Istanbul'))::integer;

    select exists (
        select 1
        from public.lessons
        where trainer_id = v_trainer_id
          and status in ('pending', 'approved')
          and (scheduled_at at time zone 'Europe/Istanbul')::date = v_slot_date
          and extract(hour from (scheduled_at at time zone 'Europe/Istanbul'))::integer = v_slot_hour
    ) into v_still_active;

    update public.trainer_slots
    set is_booked = v_still_active
    where trainer_id = v_trainer_id
      and slot_date = v_slot_date
      and slot_hour = v_slot_hour;

    return coalesce(new, old);
end;
$$ language plpgsql;

create trigger lessons_sync_trainer_slots
after insert or update of status, trainer_id, scheduled_at or delete on public.lessons
for each row execute function public.sync_trainer_slot_booking();
