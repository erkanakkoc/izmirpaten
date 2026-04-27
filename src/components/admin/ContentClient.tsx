'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2, GripVertical, ToggleLeft, ToggleRight, Edit2, Check, X } from 'lucide-react'
import type { Package, Location, Feature, InfoCard, SiteSettings } from '@/types'
import { formatPrice } from '@/lib/utils'

interface Props {
  settings: SiteSettings
  packages: Package[]
  locations: Location[]
  features: Feature[]
  infoCards: InfoCard[]
}

type Tab = 'settings' | 'packages' | 'locations' | 'features' | 'info_cards'

export default function ContentClient({ settings: initialSettings, packages: initialPackages, locations: initialLocations, features: initialFeatures, infoCards: initialInfoCards }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('settings')
  const supabase = createClient()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'settings', label: '⚙️ Site Ayarları' },
    { key: 'packages', label: '📦 Paketler' },
    { key: 'locations', label: '📍 Lokasyonlar' },
    { key: 'features', label: '✨ Özellikler' },
    { key: 'info_cards', label: '🃏 Bilgi Kartları' },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t.key ? 'bg-[#FF6B35] text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && <SiteSettingsPanel settings={initialSettings} />}
      {activeTab === 'packages' && <PackagesPanel packages={initialPackages} />}
      {activeTab === 'locations' && <LocationsPanel locations={initialLocations} />}
      {activeTab === 'features' && <FeaturesPanel features={initialFeatures} />}
      {activeTab === 'info_cards' && <InfoCardsPanel infoCards={initialInfoCards} />}
    </div>
  )
}

// ===================== SITE SETTINGS =====================
function SiteSettingsPanel({ settings: init }: { settings: SiteSettings }) {
  const [s, setS] = useState<SiteSettings>(init)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const set = (key: keyof SiteSettings, value: string) => setS((p) => ({ ...p, [key]: value }))

  const save = async () => {
    setSaving(true)
    const entries = Object.entries(s).filter(([, v]) => v !== undefined)
    const { error } = await supabase.from('site_settings').upsert(
      entries.map(([key, value]) => ({ key, value: value ?? '', updated_at: new Date().toISOString() }))
    )
    if (error) { toast.error('Ayarlar kaydedilemedi.'); setSaving(false); return }
    toast.success('Ayarlar kaydedildi.')
    setSaving(false)
  }

  const Field = ({ label, k, multiline }: { label: string; k: keyof SiteSettings; multiline?: boolean }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          rows={4}
          value={s[k] ?? ''}
          onChange={(e) => set(k, e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm resize-none"
        />
      ) : (
        <input
          type="text"
          value={s[k] ?? ''}
          onChange={(e) => set(k, e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm"
        />
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Site Başlığı" k="site_title" />
        <Field label="Site Sloganı" k="site_slogan" />
        <Field label="Hero Başlığı" k="hero_title" />
        <Field label="Hero CTA Metni" k="hero_cta_text" />
        <div className="md:col-span-2"><Field label="Hero Alt Başlığı" k="hero_subtitle" multiline /></div>
        <div className="md:col-span-2"><Field label="Hakkında Metni" k="about_text" multiline /></div>
        <Field label="Footer Sloganı" k="footer_slogan" />
        <Field label="WhatsApp Numarası (90XXXXXXXXXX)" k="whatsapp_number" />
        <Field label="Instagram URL" k="instagram_url" />
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

// ===================== PACKAGES =====================
function PackagesPanel({ packages: init }: { packages: Package[] }) {
  const [packages, setPackages] = useState<Package[]>(init)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Package>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newPkg, setNewPkg] = useState({ name: '', price: '', description: '', badge: '', is_featured: false })
  const supabase = createClient()

  const toggleActive = async (pkg: Package) => {
    const { error } = await supabase.from('packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setPackages((p) => p.map((x) => x.id === pkg.id ? { ...x, is_active: !pkg.is_active } : x))
  }

  const startEdit = (pkg: Package) => { setEditingId(pkg.id); setEditData(pkg) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const { error } = await supabase.from('packages').update({
      name: editData.name,
      price: editData.price,
      description: editData.description,
      badge: editData.badge,
      is_featured: editData.is_featured,
    }).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setPackages((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Paket güncellendi.')
  }

  const deletePkg = async (id: string) => {
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) { toast.error('Silinemedi.'); return }
    setPackages((p) => p.filter((x) => x.id !== id))
    toast.success('Paket silindi.')
  }

  const addPkg = async () => {
    if (!newPkg.name || !newPkg.price) { toast.error('Ad ve fiyat zorunlu.'); return }
    const { data, error } = await supabase.from('packages').insert({
      name: newPkg.name,
      price: parseInt(newPkg.price),
      description: newPkg.description || null,
      badge: newPkg.badge || null,
      is_featured: newPkg.is_featured,
      is_active: true,
      sort_order: packages.length + 1,
    }).select().single()
    if (error) { toast.error('Eklenemedi.'); return }
    setPackages((p) => [...p, data])
    setNewPkg({ name: '', price: '', description: '', badge: '', is_featured: false })
    setShowAdd(false)
    toast.success('Paket eklendi.')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-[#1B2A4A]">{packages.length} Paket</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all"
        >
          <Plus size={15} /> Yeni Paket
        </button>
      </div>

      {showAdd && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input placeholder="Paket adı *" value={newPkg.name} onChange={(e) => setNewPkg(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
            <input placeholder="Fiyat (₺) *" type="number" value={newPkg.price} onChange={(e) => setNewPkg(p => ({ ...p, price: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
          </div>
          <textarea placeholder="Açıklama" rows={2} value={newPkg.description} onChange={(e) => setNewPkg(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none mb-3" />
          <div className="flex gap-3 items-center">
            <input placeholder="Rozet (ör: En Popüler)" value={newPkg.badge} onChange={(e) => setNewPkg(p => ({ ...p, badge: e.target.value }))}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" checked={newPkg.is_featured} onChange={(e) => setNewPkg(p => ({ ...p, is_featured: e.target.checked }))} className="accent-[#FF6B35]" />
              Öne çıkan
            </label>
            <button onClick={addPkg} className="px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">Ekle</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">İptal</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {packages.map((pkg) => (
          <div key={pkg.id} className="px-6 py-4 flex items-start gap-4">
            <GripVertical size={18} className="text-gray-300 mt-1 flex-shrink-0 cursor-grab" />
            <div className="flex-1 min-w-0">
              {editingId === pkg.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editData.name ?? ''} onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                    <input type="number" value={editData.price ?? ''} onChange={(e) => setEditData(p => ({ ...p, price: parseInt(e.target.value) }))}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  </div>
                  <textarea rows={2} value={editData.description ?? ''} onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
                  <div className="flex gap-2">
                    <input placeholder="Rozet" value={editData.badge ?? ''} onChange={(e) => setEditData(p => ({ ...p, badge: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input type="checkbox" checked={editData.is_featured ?? false} onChange={(e) => setEditData(p => ({ ...p, is_featured: e.target.checked }))} className="accent-[#FF6B35]" />
                      Öne çıkan
                    </label>
                    <button onClick={saveEdit} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"><Check size={16} /></button>
                    <button onClick={cancelEdit} className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100"><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-[#1B2A4A]">{pkg.name}</span>
                    {pkg.badge && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{pkg.badge}</span>}
                    {pkg.is_featured && <span className="text-xs bg-[#FF6B35] text-white px-2 py-0.5 rounded-full font-semibold">Öne Çıkan</span>}
                  </div>
                  <div className="text-[#FF6B35] font-bold text-sm">{formatPrice(pkg.price)}</div>
                  {pkg.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{pkg.description}</p>}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(pkg)} className="text-gray-400 hover:text-[#FF6B35] transition-colors">
                {pkg.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
              </button>
              <button onClick={() => startEdit(pkg)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 size={15} /></button>
              <button onClick={() => deletePkg(pkg.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================== LOCATIONS =====================
function LocationsPanel({ locations: init }: { locations: Location[] }) {
  const [locations, setLocations] = useState<Location[]>(init)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Location>>({})
  const supabase = createClient()

  const startEdit = (loc: Location) => { setEditingId(loc.id); setEditData(loc) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const { error } = await supabase.from('locations').update({
      name: editData.name,
      venue: editData.venue,
      weekday_hours: editData.weekday_hours,
      weekend_hours: editData.weekend_hours,
      maps_url: editData.maps_url,
    }).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setLocations((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Lokasyon güncellendi.')
  }

  const toggleActive = async (loc: Location) => {
    await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', loc.id)
    setLocations((p) => p.map((x) => x.id === loc.id ? { ...x, is_active: !loc.is_active } : x))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
      {locations.map((loc) => (
        <div key={loc.id} className="px-6 py-5">
          {editingId === loc.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Lokasyon Adı</label>
                  <input value={editData.name ?? ''} onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Mekan Adı</label>
                  <input value={editData.venue ?? ''} onChange={(e) => setEditData(p => ({ ...p, venue: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Hafta İçi Saat</label>
                  <input value={editData.weekday_hours ?? ''} onChange={(e) => setEditData(p => ({ ...p, weekday_hours: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Hafta Sonu Saat</label>
                  <input value={editData.weekend_hours ?? ''} onChange={(e) => setEditData(p => ({ ...p, weekend_hours: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Google Maps URL</label>
                <input value={editData.maps_url ?? ''} onChange={(e) => setEditData(p => ({ ...p, maps_url: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-semibold hover:bg-green-100">
                  <Check size={15} /> Kaydet
                </button>
                <button onClick={cancelEdit} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">İptal</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[#1B2A4A]">{loc.name}</span>
                  <span className="text-gray-400 text-sm">– {loc.venue}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  {loc.weekday_hours && <div>Hafta içi: {loc.weekday_hours}</div>}
                  {loc.weekend_hours && <div>Hafta sonu: {loc.weekend_hours}</div>}
                  {loc.maps_url && <div className="text-[#FF6B35]">Google Maps bağlantısı mevcut</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(loc)}>
                  {loc.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-gray-400" />}
                </button>
                <button onClick={() => startEdit(loc)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 size={15} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ===================== FEATURES =====================
function FeaturesPanel({ features: init }: { features: Feature[] }) {
  const [features, setFeatures] = useState<Feature[]>(init)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Feature>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newF, setNewF] = useState({ title: '', description: '', icon: '' })
  const supabase = createClient()

  const startEdit = (f: Feature) => { setEditingId(f.id); setEditData(f) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const { error } = await supabase.from('features').update(editData).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setFeatures((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Güncellendi.')
  }

  const deleteF = async (id: string) => {
    await supabase.from('features').delete().eq('id', id)
    setFeatures((p) => p.filter((x) => x.id !== id))
    toast.success('Silindi.')
  }

  const toggleActive = async (f: Feature) => {
    await supabase.from('features').update({ is_active: !f.is_active }).eq('id', f.id)
    setFeatures((p) => p.map((x) => x.id === f.id ? { ...x, is_active: !f.is_active } : x))
  }

  const addFeature = async () => {
    if (!newF.title) { toast.error('Başlık zorunlu.'); return }
    const { data, error } = await supabase.from('features').insert({
      title: newF.title,
      description: newF.description || null,
      icon: newF.icon || null,
      sort_order: features.length + 1,
      is_active: true,
    }).select().single()
    if (error) { toast.error('Eklenemedi.'); return }
    setFeatures((p) => [...p, data])
    setNewF({ title: '', description: '', icon: '' })
    setShowAdd(false)
    toast.success('Özellik eklendi.')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between">
        <span className="font-bold text-[#1B2A4A]">&quot;Ne Öğreneceksin?&quot; Maddeleri</span>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">
          <Plus size={14} /> Ekle
        </button>
      </div>
      {showAdd && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex gap-3">
          <input placeholder="Başlık *" value={newF.title} onChange={(e) => setNewF(p => ({ ...p, title: e.target.value }))}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
          <input placeholder="Açıklama" value={newF.description} onChange={(e) => setNewF(p => ({ ...p, description: e.target.value }))}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
          <input placeholder="Lucide icon adı" value={newF.icon} onChange={(e) => setNewF(p => ({ ...p, icon: e.target.value }))}
            className="w-40 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
          <button onClick={addFeature} className="px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold">Ekle</button>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm">İptal</button>
        </div>
      )}
      <div className="divide-y divide-gray-50">
        {features.map((f) => (
          <div key={f.id} className="px-6 py-4 flex items-center gap-4">
            <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {editingId === f.id ? (
                <div className="flex gap-2">
                  <input value={editData.title ?? ''} onChange={(e) => setEditData(p => ({ ...p, title: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  <input value={editData.description ?? ''} onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  <input value={editData.icon ?? ''} onChange={(e) => setEditData(p => ({ ...p, icon: e.target.value }))}
                    placeholder="icon" className="w-28 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  <button onClick={saveEdit} className="p-2 bg-green-50 text-green-600 rounded-xl"><Check size={15} /></button>
                  <button onClick={cancelEdit} className="p-2 bg-gray-50 text-gray-500 rounded-xl"><X size={15} /></button>
                </div>
              ) : (
                <>
                  <div className="font-semibold text-sm text-[#1B2A4A]">{f.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{f.description} {f.icon && <code className="bg-gray-100 px-1 rounded">{f.icon}</code>}</div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => toggleActive(f)}>
                {f.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-gray-300" />}
              </button>
              <button onClick={() => startEdit(f)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 size={14} /></button>
              <button onClick={() => deleteF(f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================== INFO CARDS =====================
function InfoCardsPanel({ infoCards: init }: { infoCards: InfoCard[] }) {
  const [cards, setCards] = useState<InfoCard[]>(init)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<InfoCard>>({})
  const supabase = createClient()

  const startEdit = (c: InfoCard) => { setEditingId(c.id); setEditData(c) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const { error } = await supabase.from('info_cards').update(editData).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setCards((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Güncellendi.')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
      {cards.map((card) => (
        <div key={card.id} className="px-6 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            {editingId === card.id ? (
              <div className="flex gap-2">
                <input value={editData.title ?? ''} onChange={(e) => setEditData(p => ({ ...p, title: e.target.value }))}
                  className="w-36 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <input value={editData.content ?? ''} onChange={(e) => setEditData(p => ({ ...p, content: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <input value={editData.icon ?? ''} onChange={(e) => setEditData(p => ({ ...p, icon: e.target.value }))}
                  placeholder="icon" className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <button onClick={saveEdit} className="p-2 bg-green-50 text-green-600 rounded-xl"><Check size={15} /></button>
                <button onClick={cancelEdit} className="p-2 bg-gray-50 text-gray-500 rounded-xl"><X size={15} /></button>
              </div>
            ) : (
              <>
                <div className="font-semibold text-sm text-[#1B2A4A]">{card.title} {card.icon && <code className="bg-gray-100 text-xs px-1 rounded ml-1">{card.icon}</code>}</div>
                <div className="text-xs text-gray-400 mt-0.5">{card.content}</div>
              </>
            )}
          </div>
          {editingId !== card.id && (
            <button onClick={() => startEdit(card)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 flex-shrink-0"><Edit2 size={15} /></button>
          )}
        </div>
      ))}
    </div>
  )
}
