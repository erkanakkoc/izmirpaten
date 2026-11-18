-- Geri alma: 0003_group_sessions.sql
drop index if exists public.idx_lessons_group_session;
drop index if exists public.idx_applications_group_session;
drop index if exists public.idx_group_session_participants_session;
drop index if exists public.idx_group_sessions_status;
drop index if exists public.idx_group_sessions_discipline;

alter table public.lessons drop column if exists group_session_id;
alter table public.applications drop column if exists group_session_id;

drop table if exists public.group_session_participants;
drop table if exists public.group_sessions;
