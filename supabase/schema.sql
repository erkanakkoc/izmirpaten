-- =============================================
-- İZMİR PATEN — Veritabanı Şeması ve Seed
-- =============================================

-- Paketler (önce oluştur, applications referans alıyor)
create table packages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price integer not null,
  description text,
  badge text,
  is_featured boolean default false,
  is_active boolean default true,
  sort_order integer default 0
);

-- Lokasyonlar
create table locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  venue text not null,
  weekday_hours text,
  weekend_hours text,
  maps_url text,
  is_active boolean default true
);

-- Başvurular
create table applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  full_name text not null,
  phone text not null,
  email text,
  age integer,
  is_for_self boolean default true,
  student_name text,
  student_age integer,
  package_id uuid references packages(id) on delete set null,
  package_name text not null,
  location_id uuid references locations(id) on delete set null,
  location_name text not null,
  available_days text[],
  available_hours text,
  notes text,
  status text default 'new' check (status in ('new','reviewed','approved','rejected')),
  video_consent boolean default false
);

-- Site ayarları (key-value)
create table site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- "Ne Öğreneceksin?" maddeleri
create table features (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  icon text,
  sort_order integer default 0,
  is_active boolean default true
);

-- Bilgi kartları
create table info_cards (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  icon text,
  sort_order integer default 0
);

-- Mail bildirimleri
create table mail_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  application_id uuid references applications(id) on delete set null,
  applicant_name text,
  applicant_email text,
  subject text,
  status text default 'sent'
);

-- İzin verilen admin e-postaları
create table allowed_emails (
  email text primary key
);

-- =============================================
-- RLS POLİTİKALARI
-- =============================================

alter table applications enable row level security;
alter table packages enable row level security;
alter table locations enable row level security;
alter table site_settings enable row level security;
alter table features enable row level security;
alter table info_cards enable row level security;
alter table mail_logs enable row level security;
alter table allowed_emails enable row level security;

-- Public okuma (site için)
create policy "Public read packages" on packages for select using (is_active = true);
create policy "Public read locations" on locations for select using (is_active = true);
create policy "Public read site_settings" on site_settings for select using (true);
create policy "Public read features" on features for select using (is_active = true);
create policy "Public read info_cards" on info_cards for select using (true);

-- Public yazma (form için)
create policy "Public insert applications" on applications for insert with check (true);

-- Admin tam erişim (authenticated kullanıcı)
create policy "Admin full access applications" on applications for all using (auth.role() = 'authenticated');
create policy "Admin full access packages" on packages for all using (auth.role() = 'authenticated');
create policy "Admin full access locations" on locations for all using (auth.role() = 'authenticated');
create policy "Admin full access settings" on site_settings for all using (auth.role() = 'authenticated');
create policy "Admin full access features" on features for all using (auth.role() = 'authenticated');
create policy "Admin full access info_cards" on info_cards for all using (auth.role() = 'authenticated');
create policy "Admin full access mail_logs" on mail_logs for all using (auth.role() = 'authenticated');
create policy "Admin full access allowed_emails" on allowed_emails for all using (auth.role() = 'authenticated');

-- =============================================
-- SEED VERİLERİ
-- =============================================

-- Paketler
insert into packages (name, price, description, badge, is_featured, sort_order) values
('Birebir – Tek Ders', 1200, 'Patenle ilk tanışman için mükemmel başlangıç. Birebir ilgiyle temel denge, duruş ve hareket tekniklerini öğren.', null, false, 1),
('Birebir – Aylık 4 Ders', 4000, 'Haftada bir buluşalım, her derse bir adım daha ileri git. Düzenli antrenmanla fark hızla ortaya çıkar.', null, false, 2),
('Birebir – Aylık 8 Ders', 7500, 'Haftada iki ders, iki kat ilerleme. Kısa sürede güvenle paten sürmek isteyenler için en yoğun birebir program.', 'En Çok Tercih Edilen', true, 3),
('Grup – Aylık 4 Ders', 2800, 'Aynı hedefte buluşan küçük bir grupla öğrenmek hem eğlenceli hem motive edici. Ayda 4 dersle sağlam bir temel.', null, false, 4),
('Grup – Aylık 8 Ders', 5000, 'Grubun enerjisiyle öğrenmek çok daha keyifli. Ayda 8 dersle hem sosyalleş hem de paten becerilerini hızla geliştir.', 'En Avantajlı', false, 5),
('Mini Grup – Kişi Başı', 800, 'Arkadaşlarınla gel, birlikte öğren. En az 2 kişilik kendi grubunla ders başı kişi başı uygun fiyat.', null, false, 6);

-- Lokasyonlar
insert into locations (name, venue, weekday_hours, weekend_hours, maps_url) values
('Bostanlı', 'Demokrasi Meydanı', '19:00 – 22:00', '16:00 – 21:00', 'https://maps.google.com/?q=Demokrasi+Meydani+Bostanli+Izmir'),
('Göztepe', 'Sahil Paten Pisti', '19:00 – 22:00', '13:00 – 19:00', 'https://maps.google.com/?q=Goztepe+Sahil+Paten+Pisti+Izmir');

-- Site ayarları
insert into site_settings (key, value) values
('site_title', 'İzmir Paten'),
('site_slogan', 'İzmir''in Rüzgarında Özgürce Süz'),
('hero_title', 'Patenle Tanış,' || chr(10) || 'İzmir''i Hisset'),
('hero_subtitle', 'Bostanlı ve Göztepe''de profesyonel birebir ve grup paten dersleri. Başlangıçtan ileri seviyeye, her yaşa uygun eğitim programları.'),
('hero_cta_text', 'Hemen Başvur'),
('about_text', 'Merhaba! Ben İzmir''in açık havalarında, Bostanlı''nın canlı meydanında ve Göztepe''nin sahilinde paten dersleri veriyorum. Amacım; patenin sadece bir spor değil, özgürlüğün ve eğlencenin bir ifadesi olduğunu herkese yaşatmak. Çocuğunun ilk adımlarını atmasına eşlik etmek ya da senin için yeni bir başlangıç yapmak — her ikisi de benim için eşit derecede değerli.'),
('footer_slogan', 'İzmir''in Rüzgarında Özgürce Süz'),
('instagram_url', 'https://instagram.com/izmirpaten'),
('whatsapp_number', '905XXXXXXXXX'),
('admin_email_template', '<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#FF6B35">Yeni Başvuru 🛼</h2><p><strong>Ad Soyad:</strong> {{full_name}}</p><p><strong>Telefon:</strong> {{phone}}</p><p><strong>E-posta:</strong> {{email}}</p><p><strong>Yaş:</strong> {{age}}</p><p><strong>Paket:</strong> {{package_name}}</p><p><strong>Lokasyon:</strong> {{location_name}}</p><p><strong>Müsait Günler:</strong> {{available_days}}</p><p><strong>Müsait Saatler:</strong> {{available_hours}}</p><p><strong>Notlar:</strong> {{notes}}</p><p><strong>Video İzni:</strong> {{video_consent}}</p><hr/><p style="color:#888;font-size:12px">izmirpaten.com üzerinden gönderildi</p></div>');

-- "Ne Öğreneceksin?" maddeleri
insert into features (title, description, icon, sort_order) values
('Denge & Duruş', 'Patenin üzerinde sağlam ve güvenli bir duruş için temel denge tekniklerini öğren.', 'Footprints', 1),
('İleri & Geri Hareket', 'Hem ileri hem geri kayma tekniklerini doğal bir akışla kavra.', 'MoveRight', 2),
('Fren Teknikleri', 'Farklı fren yöntemlerini öğrenerek her durumda güvenle dur.', 'ShieldCheck', 3),
('Viraj & Manevra', 'Dar alanlarda manevra kabiliyeti ve virajları akıcı bir şekilde alma.', 'RefreshCw', 4),
('Hız Kontrolü', 'Hızını bilinçli yönet, hem güvenli hem de keyifli sür.', 'Gauge', 5),
('Düşme & Kalkma', 'Doğru düşme tekniğiyle kendini koru, hızlıca kalk ve devam et.', 'ArrowUpFromLine', 6);

-- Bilgi kartları
insert into info_cards (title, content, icon, sort_order) values
('Ders Süresi', '40 dakika', 'Clock', 1),
('Grup Büyüklüğü', 'Maksimum 5 kişi', 'Users', 2),
('Ekipman', 'Paten, kask, dizlik ve dirseklik kendi sorumluluğunuzdadır.', 'ShoppingBag', 3),
('Paket Politikası', 'Aylık paketlerdeki dersler ay içinde tamamlanmalıdır.', 'CalendarCheck', 4),
('Video & Fotoğraf', 'Başvuru formunda tercihinizi belirtebilirsiniz. İzin vermediğiniz sürece hiçbir görsel paylaşılmaz.', 'Video', 5);

-- Admin e-postası (kendi e-postanı ekle)
-- insert into allowed_emails (email) values ('your@email.com');
