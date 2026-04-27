import { createClient } from '@/lib/supabase/server'
import { settingsArrayToObject } from '@/lib/utils'
import Navbar from '@/components/site/Navbar'
import HeroSection from '@/components/site/HeroSection'
import AboutSection from '@/components/site/AboutSection'
import PackagesSection from '@/components/site/PackagesSection'
import LocationsSection from '@/components/site/LocationsSection'
import ApplicationForm from '@/components/site/ApplicationForm'
import Footer from '@/components/site/Footer'

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()

  const [settingsRes, packagesRes, locationsRes, featuresRes, infoCardsRes] = await Promise.all([
    supabase.from('site_settings').select('*'),
    supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('locations').select('*').eq('is_active', true),
    supabase.from('features').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('info_cards').select('*').order('sort_order'),
  ])

  const settings = settingsArrayToObject(settingsRes.data ?? [])
  const packages = packagesRes.data ?? []
  const locations = locationsRes.data ?? []
  const features = featuresRes.data ?? []
  const infoCards = infoCardsRes.data ?? []

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
