-- 0006_mail_logs_error_text.sql
-- Mail gönderimi başarısız olduğunda gerçek hata mesajını saklamak için.
-- HATA 3 düzeltmesi: "sent_by_admin" artık yalnızca SMTP gerçekten kabul
-- ettiğinde yazılıyor; başarısızlıkta status='failed' + error_text doluyor.

alter table public.mail_logs add column error_text text;
