import { createClient } from '@/lib/supabase/server'
import { settingsArrayToObject } from '@/lib/utils'
import Navbar from '@/components/site/Navbar'
import HeroSection from '@/components/site/HeroSection'
import AboutSection from '@/components/site/AboutSection'
import DisciplinesSection from '@/components/site/DisciplinesSection'
import PackagesSection from '@/components/site/PackagesSection'
import LocationsSection from '@/components/site/LocationsSection'
import ApplicationForm from '@/components/site/ApplicationForm'
import ReviewsSection from '@/components/site/ReviewsSection'
import GallerySection from '@/components/site/GallerySection'
import InstagramSection from '@/components/site/InstagramSection'
import Footer from '@/components/site/Footer'
import type { Package, Location, Feature, InfoCard, SiteSettings, Review, GalleryImage, Discipline, LocationDiscipline, OpenGroupSession } from '@/types'

export const revalidate = 60

export default async function Home() {
  let settings: SiteSettings = {}
  let packages: Package[] = []
  let locations: Location[] = []
  let features: Feature[] = []
  let infoCards: InfoCard[] = []
  let reviews: Review[] = []
  let galleryImages: GalleryImage[] = []
  let disciplines: Discipline[] = []
  let locationDisciplines: LocationDiscipline[] = []
  let openGroupSessions: OpenGroupSession[] = []

  try {
    const supabase = await createClient()
    const todayStr = new Date().toISOString().slice(0, 10)
    const [settingsRes, packagesRes, locationsRes, featuresRes, infoCardsRes, reviewsRes, galleryRes, disciplinesRes, locationDisciplinesRes, groupSessionsRes] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('locations').select('*').eq('is_active', true),
      supabase.from('features').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('info_cards').select('*').order('sort_order'),
      supabase.from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('gallery_images').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('disciplines').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('location_disciplines').select('*'),
      supabase.from('group_sessions').select('id, discipline_id, location_id, session_date, slot_hour, max_participants, locations(name, venue)')
        .eq('status', 'open').gte('session_date', todayStr).order('session_date'),
    ])
    settings = settingsArrayToObject(settingsRes.data ?? [])
    disciplines = disciplinesRes.data ?? []
    locationDisciplines = locationDisciplinesRes.data ?? []
    const activeDisciplineIds = new Set(disciplines.map((d) => d.id))

    const rawGroupSessions = groupSessionsRes.data ?? []
    const sessionIds = rawGroupSessions.map((s) => s.id)
    const { data: participants } = sessionIds.length
      ? await supabase.from('group_session_participants').select('group_session_id').eq('status', 'approved').in('group_session_id', sessionIds)
      : { data: [] }
    const approvedCountBySession = new Map<string, number>()
    for (const p of participants ?? []) {
      approvedCountBySession.set(p.group_session_id, (approvedCountBySession.get(p.group_session_id) ?? 0) + 1)
    }
    openGroupSessions = rawGroupSessions
      .filter((s) => activeDisciplineIds.has(s.discipline_id))
      .map((s) => {
        const loc = (Array.isArray(s.locations) ? s.locations[0] : s.locations) as { name: string; venue: string } | null
        const approved = approvedCountBySession.get(s.id) ?? 0
        return {
          id: s.id,
          discipline_id: s.discipline_id,
          location_id: s.location_id,
          location_name: loc ? `${loc.name} – ${loc.venue}` : 'Lokasyon',
          session_date: s.session_date,
          slot_hour: s.slot_hour,
          remaining: Math.max(0, s.max_participants - approved),
        }
      })
      .filter((s) => s.remaining > 0)
    // Pasif bir branşa ait paket aktif olsa bile sitede görünmesin
    packages = (packagesRes.data ?? []).filter((p) => activeDisciplineIds.has(p.discipline_id))
    locations = locationsRes.data ?? []
    features = featuresRes.data ?? []
    infoCards = infoCardsRes.data ?? []
    reviews = reviewsRes.data ?? []
    galleryImages = galleryRes.data ?? []
  } catch {
    // Supabase henüz yapılandırılmamışsa boş varsayılanlarla render et
  }

  return (
    <main>
      <Navbar
        siteTitle={settings.site_title}
        logoUrl={settings.logo_url}
        logoDisplayMode={settings.logo_display_mode}
        logoHeight={settings.logo_height ? parseInt(settings.logo_height) : undefined}
      />
      <HeroSection settings={settings} />
      <AboutSection settings={settings} features={features} infoCards={infoCards} />
      <DisciplinesSection disciplines={disciplines} />
      <PackagesSection packages={packages} disciplines={disciplines} prerequisiteNote={settings.group_prerequisite_note} />
      <LocationsSection locations={locations} disciplines={disciplines} locationDisciplines={locationDisciplines} />
      {settings.show_gallery !== 'false' && galleryImages.length > 0 && (
        <GallerySection images={galleryImages} />
      )}
      {settings.show_reviews !== 'false' && (
        <ReviewsSection reviews={reviews} packages={packages} />
      )}
      {settings.instagram_show_section === 'true' && (
        <InstagramSection instagramUrl={settings.instagram_url} />
      )}
      <ApplicationForm
        packages={packages}
        locations={locations}
        disciplines={disciplines}
        locationDisciplines={locationDisciplines}
        openGroupSessions={openGroupSessions}
        kvkkUrl={settings.kvkk_url}
      />
      <Footer settings={settings} />
    </main>
  )
}
