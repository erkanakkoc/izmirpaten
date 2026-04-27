# İzmir Paten – izmirpaten.com

Profesyonel paten eğitmeni için modern, tam özellikli web sitesi ve admin paneli.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase
- **Email:** Resend
- **Deploy:** Vercel

---

## Kurulum

### 1. Ortam değişkenlerini ayarla

`.env.local` dosyasını düzenle:

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase proje URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=       # Service role key (API routes)
RESEND_API_KEY=                  # Resend API anahtarı
ADMIN_EMAIL=                     # Bildirim gidecek adres
NEXT_PUBLIC_SITE_URL=https://izmirpaten.com
```

### 2. Supabase yapılandırması

1. supabase.com'da yeni proje oluştur
2. SQL Editor'a gir, `supabase/schema.sql` içeriğini yapıştır ve çalıştır
3. Tablolar oluşur, RLS politikaları uygulanır, seed verileri eklenir

### 3. Admin kullanıcısı ekleme

**a) Supabase Auth üzerinden kullanıcı oluştur:**
- Dashboard → Authentication → Users → Add User → E-posta + şifre

**b) `allowed_emails` tablosuna ekle:**
```sql
INSERT INTO allowed_emails (email) VALUES ('senin@emailin.com');
```

> Bu adım olmadan admin girişi reddedilir.

### 4. Resend kurulumu

1. resend.com'da hesap aç, API key oluştur
2. Domain doğrula (veya test için onboarding@resend.dev)
3. `src/app/api/apply/route.ts` içindeki `from` adresini güncelle

---

## Vercel Deploy

1. vercel.com → New Project → GitHub repo seç
2. Environment Variables'a `.env.local` değerlerini ekle
3. Deploy

---

## Geliştirme

```
npm install
npm run dev     # localhost:3000
npm run build   # Production build
```

---

## Admin Paneli

`/admin/login` — Supabase Auth girişi

| Sayfa | Açıklama |
|-------|----------|
| `/admin` | Dashboard — istatistikler, grafikler |
| `/admin/applications` | Başvuru yönetimi, CSV export |
| `/admin/mail` | Bildirim geçmişi, mail şablonu |
| `/admin/content` | Site ayarları, paketler, lokasyonlar |
