import { createClient } from '@/lib/supabase/server'
import { settingsArrayToObject } from '@/lib/utils'
import Navbar from '@/components/site/Navbar'
import HeroSection from '@/components/site/HeroSection'
import AboutSection from '@/components/site/AboutSection'
import PackagesSection from '@/components/site/PackagesSection'
import LocationsSection from '@/components/site/LocationsSection'
import ApplicationForm from '@/components/site/ApplicationForm'
import Footer from '@/components/site/Footer'
import type { Package, Location, Feature, InfoCard, SiteSettings } from '@/types'

export const revalidate = 60

export default async function Home() {
  let settings: SiteSettings = {}
  let packages: Package[] = []
  let locations: Location[] = []
  let features: Feature[] = []
  let infoCards: InfoCard[] = []

  try {
    const supabase = await createClient()
    const [settingsRes, packagesRes, locationsRes, featuresRes, infoCardsRes] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('locations').select('*').eq('is_active', true),
      supabase.from('features').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('info_cards').select('*').order('sort_order'),
    ])
    settings = settingsArrayToObject(settingsRes.data ?? [])
    packages = packagesRes.data ?? []
    locations = locationsRes.data ?? []
    features = featuresRes.data ?? []
    infoCards = infoCardsRes.data ?? []
  } catch {
    // Supabase henüz yapılandırılmamışsa boş varsayılanlarla render et
  }

  return (
    <main>
      <Navbar siteTitle={settings.site_title} />
      <HeroSection settings={settings} />
      <AboutSection settings={settings} features={features} infoCards={infoCards} />
      <PackagesSection packages={packages} />
      <LocationsSection locations={locations} />
      <ApplicationForm packages={packages} locations={locations} />
      <Footer settings={settings} />
    </main>
  )
}
