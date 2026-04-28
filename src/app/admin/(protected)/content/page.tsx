import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminPermissions } from '@/lib/admin-auth'
import { settingsArrayToObject } from '@/lib/utils'
import ContentClient from '@/components/admin/ContentClient'

export const revalidate = 0

export default async function ContentPage() {
  const { locationFilter } = await getAdminPermissions()
  if (locationFilter) redirect('/admin/applications')

  const supabase = await createClient()

  const [settingsRes, packagesRes, locationsRes, featuresRes, infoCardsRes, galleryRes] = await Promise.all([
    supabase.from('site_settings').select('*'),
    supabase.from('packages').select('*').order('sort_order'),
    supabase.from('locations').select('*'),
    supabase.from('features').select('*').order('sort_order'),
    supabase.from('info_cards').select('*').order('sort_order'),
    supabase.from('gallery_images').select('*').order('sort_order'),
  ])

  const settings = settingsArrayToObject(settingsRes.data ?? [])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">İçerik Yönetimi</h1>
        <p className="text-gray-500 text-sm mt-1">Site içeriklerini, paketleri ve lokasyonları düzenle.</p>
      </div>
      <ContentClient
        settings={settings}
        packages={packagesRes.data ?? []}
        locations={locationsRes.data ?? []}
        features={featuresRes.data ?? []}
        infoCards={infoCardsRes.data ?? []}
        galleryImages={galleryRes.data ?? []}
      />
    </div>
  )
}
