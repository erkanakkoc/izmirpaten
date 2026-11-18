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
| `/admin/applications` | Başvuru yönetimi, CSV export, branş filtresi |
| `/admin/group-sessions` | Grup dersi oturumları: aç, başvuru onayla, eğitmen ata |
| `/admin/trainers` | Eğitmen yönetimi, branş ataması |
| `/admin/students` | Öğrenci yönetimi, branş bazlı kayıtlar |
| `/admin/payments` | Ödeme onayı |
| `/admin/mail` | Bildirim geçmişi, mail şablonu |
| `/admin/content` | Site ayarları, branşlar, paketler, lokasyonlar |

---

## Çoklu Branş (Discipline) Sistemi

Site tek bir branşa (başlangıçta "Tekerlekli Paten") bağımlı değil — buz pateni,
scooter gibi yeni branşlar admin panelinden eklenip yönetilebilir.

### Migration sırası

`supabase/migrations/` altındaki dosyalar **numara sırasıyla**, tek seferlik
olarak Supabase SQL Editor'da (veya `psql -f`) çalıştırılmalı:

1. `0001_disciplines.sql` — `disciplines`, `trainer_disciplines`, `location_disciplines`
   tabloları; mevcut veri "Tekerlekli Paten" branşına bağlanır, pasif "Buz Pateni" eklenir.
2. `0002_discipline_id_columns.sql` — `packages`, `applications`, `trainer_slots`,
   `lessons`, `enrollments` tablolarına `discipline_id` eklenir (NOT NULL, backfill'li).
3. `0003_group_sessions.sql` — `group_sessions`, `group_session_participants` tabloları
   (admin'in açtığı grup dersi oturumları ve başvuranlar).
4. `0004_trainer_overlap_guard.sql` — Bir eğitmenin aynı saatte (branş fark etmeksizin)
   yalnızca tek bir aktif dersi olabilmesini garanti eden partial UNIQUE index + trigger.
5. `0005_discipline_delete_guard.sql` — Bağlı kayıt varsa branşın hard-delete edilmesini
   engelleyen trigger (branşlar silinmez, yalnızca pasife alınır).

**Önemli:** `0002` migration'ı `discipline_id` kolonlarını NOT NULL yapar — bu
migration'ı uygulamadan önce uygulama kodu (bu repodaki `feature/multi-discipline`
sonrası `main`) deploy edilmiş olmalı, aksi halde eski kod yeni şemaya veri
yazamaz (başvuru formu, ders rezervasyonu vb. 500 hatası verir).

### Geri alma (rollback)

Her migration'ın eşleniği `supabase/migrations/down/` altında, **ters sırada**
çalıştırılmalı (0005 → 0001). Kod tarafını geri almak için:

```
git checkout pre-multi-discipline-backup
```

DB'yi tam yedekten geri yüklemek gerekiyorsa `backups/README-restore.md`
dosyasındaki adımları izleyin (bu dosya `.gitignore`'da, yalnızca yerel/yedek
ortamlarda bulunur).

### Yeni bir branş nasıl eklenir

1. `/admin/content` → **Branşlar** sekmesi → "Yeni Branş": ad, ikon (Lucide bileşen
   adı, ör. `Snowflake`), ders süresi, max grup büyüklüğü, ekipman notu gir.
   Yeni branş varsayılan olarak **pasif** eklenir.
2. `/admin/content` → **Lokasyonlar**: branşın verileceği lokasyon(lar)ı seç
   (mevcut bir lokasyonu düzenleyip branşı işaretle, ya da "Yeni Lokasyon Ekle").
3. `/admin/content` → **Paketler**: branşa en az bir aktif paket ekle (branş,
   aktif paketi olmadan sitede görünmez).
4. `/admin/trainers`: branşı verecek eğitmen(ler)i seç (çoklu seçim rozetleri).
5. `/admin/content` → **Branşlar**: branşı **aktif** yap.

Branş aktif olduğunda otomatik olarak: ana sayfada "Derslerimiz" kartı,
başvuru formunda branş seçeneği, eğitmen müsaitlik takviminde ayrı branş
sekmesi olarak görünür.

### Grup dersi akışı

1. `/admin/group-sessions` → "Yeni Oturum Aç": branş, lokasyon, tarih/saat,
   kontenjan (eğitmen henüz atanmaz).
2. Adaylar ana sayfadaki başvuru formunda "Grup Dersi" sekmesinden bu açık
   saate başvurur.
3. Admin başvuruları tek tek onaylar/reddeder.
4. En az bir onaylı katılımcı olunca, admin o branşa atanmış bir eğitmen seçip
   atar — bu an itibariyle eğitmenin takviminde o saat (tüm branşlarda) dolu
   sayılır.
