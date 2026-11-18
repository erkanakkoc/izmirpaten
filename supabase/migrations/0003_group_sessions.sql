-- 0003_group_sessions.sql
-- Grup dersi akışı: admin önce branş+tarih+saat+kontenjanla bir grup oturumu açar (eğitmen yok),
-- adaylar bu açık oturuma başvurur, admin başvuruları onaylar ve bir eğitmen atar.
-- Eğitmen atandığı anda (status 'confirmed') bu oturum için public.lessons'a tek bir satır açılır
-- (student_id/enrollment_id NULL, group_session_id dolu) — böylece mevcut trainer_slots/lessons
-- tabanlı çakışma kontrolü bireysel ve grup dersleri için ortak çalışır.

create table public.group_sessions (
    id uuid default gen_random_uuid() primary key,
    discipline_id uuid not null references public.disciplines(id),
    location_id uuid not null references public.locations(id),
    session_date date not null,
    slot_hour integer not null check (slot_hour >= 0 and slot_hour <= 23),
    max_participants integer not null,
    trainer_id uuid references public.trainers(id) on delete set null,
    lesson_id uuid references public.lessons(id) on delete set null,
    status text not null default 'open'
        check (status in ('open', 'confirmed', 'cancelled', 'completed')),
    created_at timestamp with time zone default now()
);

create table public.group_session_participants (
    id uuid default gen_random_uuid() primary key,
    group_session_id uuid not null references public.group_sessions(id) on delete cascade,
    application_id uuid references public.applications(id) on delete set null,
    student_id uuid references public.students(id) on delete set null,
    enrollment_id uuid references public.enrollments(id) on delete set null,
    status text not null default 'pending'
        check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default now()
);

-- Bir başvuru, grup oturumuna bağlıysa işaretlenir (NULL ise bireysel/paket başvurusudur)
alter table public.applications
    add column group_session_id uuid references public.group_sessions(id) on delete set null;

-- Bir ders, grup oturumuna bağlıysa işaretlenir (NULL ise bireysel 1:1 derstir)
alter table public.lessons
    add column group_session_id uuid references public.group_sessions(id) on delete set null;

create index idx_group_sessions_discipline on public.group_sessions(discipline_id);
create index idx_group_sessions_status on public.group_sessions(status);
create index idx_group_session_participants_session on public.group_session_participants(group_session_id);
create index idx_applications_group_session on public.applications(group_session_id);
create index idx_lessons_group_session on public.lessons(group_session_id);

-- RLS
alter table public.group_sessions enable row level security;
alter table public.group_session_participants enable row level security;

create policy "Public read open group_sessions" on public.group_sessions
    for select using (status in ('open', 'confirmed'));
create policy "Admin full access group_sessions" on public.group_sessions
    using (auth.role() = 'authenticated');

create policy "Auth access group_session_participants" on public.group_session_participants
    using (auth.role() = 'authenticated');
