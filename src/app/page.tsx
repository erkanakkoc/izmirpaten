import { createClient } from '@/lib/supabase/server'
import { settingsArrayToObject } from '@/lib/utils'
import Navbar from '@/components/site/Navbar'
import HeroSection from '@/components/site/HeroSection'
import AboutSection from '@/components/site/AboutSection'
import PackagesSection from '@/components/site/PackagesSection'
import LocationsSection from '@/components/site/LocationsSection'
import ApplicationForm from '@/components/site/ApplicationForm'
import ReviewsSection from '@/components/site/ReviewsSection'
import GallerySection from '@/components/site/GallerySection'
import InstagramSection from '@/components/site/InstagramSection'
import Footer from '@/components/site/Footer'
import type { Package, Location, Feature, InfoCard, SiteSettings, Review, GalleryImage } from '@/types'

export const revalidate = 60

export default async function Home() {
  let settings: SiteSettings = {}
  let packages: Package[] = []
  let locations: Location[] = []
  let features: Feature[] = []
  let infoCards: InfoCard[] = []
  let reviews: Review[] = []
  let galleryImages: GalleryImage[] = []

  try {
    const supabase = await createClient()
    const [settingsRes, packagesRes, locationsRes, featuresRes, infoCardsRes, reviewsRes, galleryRes] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('locations').select('*').eq('is_active', true),
      supabase.from('features').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('info_cards').select('*').order('sort_order'),
      supabase.from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('gallery_images').select('*').eq('is_active', true).order('sort_order'),
    ])
    settings = settingsArrayToObject(settingsRes.data ?? [])
    packages = packagesRes.data ?? []
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
      <PackagesSection packages={packages} prerequisiteNote={settings.group_prerequisite_note} />
      <LocationsSection locations={locations} />
      {settings.show_gallery !== 'false' && galleryImages.length > 0 && (
        <GallerySection images={galleryImages} />
      )}
      {settings.show_reviews !== 'false' && (
        <ReviewsSection reviews={reviews} packages={packages} />
      )}
      {settings.instagram_show_section === 'true' && (
        <InstagramSection instagramUrl={settings.instagram_url} />
      )}
      <ApplicationForm packages={packages} locations={locations} />
      <Footer settings={settings} />
    </main>
  )
}
