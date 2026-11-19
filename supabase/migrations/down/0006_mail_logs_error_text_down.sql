-- Geri alma: 0006_mail_logs_error_text.sql
alter table public.mail_logs drop column if exists error_text;
