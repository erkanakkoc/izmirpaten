'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2, GripVertical, ToggleLeft, ToggleRight, Edit2, Check, X } from 'lucide-react'
import type { Package, Location, Feature, InfoCard, SiteSettings, GalleryImage } from '@/types'
import { formatPrice } from '@/lib/utils'
import LogoCropUpload from './LogoCropUpload'
import GalleryManager from './GalleryManager'

// ─── Tüm panel bileşenleri ContentClient DIŞINDA tanımlanmış ───
// İçeride tanımlansaydı her state değişiminde yeniden oluşturulur,
// React bunları yeni tip sayar, input focus kaybı yaşanır.

const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm'
const SMALL_INPUT_CLS = 'px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]'

// ===================== SITE SETTINGS =====================
function SiteSettingsPanel({ settings: init }: { settings: SiteSettings }) {
  const [s, setS] = useState<SiteSettings>(init)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof SiteSettings, value: string) =>
    setS((p) => ({ ...p, [key]: value }))

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const entries = Object.entries(s).filter(([, v]) => v !== undefined)
    const { error } = await supabase.from('site_settings').upsert(
      entries.map(([key, value]) => ({ key, value: value ?? '', updated_at: new Date().toISOString() }))
    )
    if (error) { toast.error('Ayarlar kaydedilemedi.'); setSaving(false); return }
    toast.success('Ayarlar kaydedildi.')
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {([
          ['Site Başlığı', 'site_title'],
          ['Site Sloganı', 'site_slogan'],
          ['Hero Başlığı', 'hero_title'],
          ['Hero CTA Metni', 'hero_cta_text'],
          ['Footer Sloganı', 'footer_slogan'],
          ['WhatsApp Numarası (90XXXXXXXXXX)', 'whatsapp_number'],
          ['Instagram URL', 'instagram_url'],
          ['KVKK Aydınlatma Metni URL', 'kvkk_url'],
        ] as [string, keyof SiteSettings][]).map(([label, k]) => (
          <div key={k}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <input
              type="text"
              value={s[k] ?? ''}
              onChange={(e) => set(k, e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        ))}

        {/* Logo ayarları */}
        <div className="md:col-span-2 p-5 rounded-2xl border border-gray-100 bg-gray-50 space-y-4">
          <div className="font-semibold text-sm text-[#1B2A4A]">Logo Ayarları</div>

          {/* Display mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Navbar Görünümü</label>
            <div className="flex gap-3">
              {([
                ['logo_only', '🖼 Sadece Logo'],
                ['logo_and_title', '🖼 Logo + Başlık'],
                ['title_only', '✏️ Sadece Başlık'],
              ] as [SiteSettings['logo_display_mode'], string][]).map(([val, label]) => (
                <label key={val} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold ${
                  (s.logo_display_mode ?? 'logo_and_title') === val
                    ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    className="hidden"
                    checked={(s.logo_display_mode ?? 'logo_and_title') === val}
                    onChange={() => set('logo_display_mode', val!)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Logo yükleme + kırpma */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Logo</label>
              <LogoCropUpload
                currentUrl={s.logo_url}
                onComplete={(url) => set('logo_url', url)}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Yükleme sonrası URL otomatik dolar — yukarıdaki &quot;Kaydet&quot; butonu ile kaydet.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Logo Yüksekliği (px)</label>
              <input
                type="number"
                min={16}
                max={120}
                value={s.logo_height ?? '32'}
                onChange={(e) => set('logo_height', e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Önizleme */}
          {s.logo_url && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Önizleme</label>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] rounded-xl">
                {(s.logo_display_mode ?? 'logo_and_title') !== 'title_only' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.logo_url}
                    alt="Logo"
                    style={{ height: `${s.logo_height ?? 32}px` }}
                    className="w-auto object-contain"
                  />
                )}
                {(s.logo_display_mode ?? 'logo_and_title') !== 'logo_only' && (
                  <span className="font-extrabold text-white text-sm">{s.site_title || 'Site Başlığı'}</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Alt Başlığı</label>
          <textarea rows={3} value={s.hero_subtitle ?? ''} onChange={(e) => set('hero_subtitle', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm resize-none" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hakkında Metni</label>
          <textarea rows={5} value={s.about_text ?? ''} onChange={(e) => set('about_text', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm resize-none" />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-60">
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

  const toggleActive = async (pkg: Package) => {
    const supabase = createClient()
    const { error } = await supabase.from('packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setPackages((p) => p.map((x) => x.id === pkg.id ? { ...x, is_active: !pkg.is_active } : x))
  }

  const startEdit = (pkg: Package) => { setEditingId(pkg.id); setEditData(pkg) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const supabase = createClient()
    const { error } = await supabase.from('packages').update({
      name: editData.name, price: editData.price,
      description: editData.description, badge: editData.badge, is_featured: editData.is_featured,
    }).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setPackages((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Paket güncellendi.')
  }

  const deletePkg = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) { toast.error('Silinemedi.'); return }
    setPackages((p) => p.filter((x) => x.id !== id))
    toast.success('Paket silindi.')
  }

  const addPkg = async () => {
    if (!newPkg.name || !newPkg.price) { toast.error('Ad ve fiyat zorunlu.'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('packages').insert({
      name: newPkg.name, price: parseInt(newPkg.price),
      description: newPkg.description || null, badge: newPkg.badge || null,
      is_featured: newPkg.is_featured, is_active: true, sort_order: packages.length + 1,
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
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all">
          <Plus size={15} /> Yeni Paket
        </button>
      </div>

      {showAdd && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input placeholder="Paket adı *" value={newPkg.name}
              onChange={(e) => setNewPkg(p => ({ ...p, name: e.target.value }))}
              className={SMALL_INPUT_CLS} />
            <input placeholder="Fiyat (₺) *" type="number" value={newPkg.price}
              onChange={(e) => setNewPkg(p => ({ ...p, price: e.target.value }))}
              className={SMALL_INPUT_CLS} />
          </div>
          <textarea placeholder="Açıklama" rows={2} value={newPkg.description}
            onChange={(e) => setNewPkg(p => ({ ...p, description: e.target.value }))}
            className={`w-full ${SMALL_INPUT_CLS} resize-none mb-3`} />
          <div className="flex gap-3 items-center">
            <input placeholder="Rozet (ör: En Popüler)" value={newPkg.badge}
              onChange={(e) => setNewPkg(p => ({ ...p, badge: e.target.value }))}
              className={`flex-1 ${SMALL_INPUT_CLS}`} />
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" checked={newPkg.is_featured}
                onChange={(e) => setNewPkg(p => ({ ...p, is_featured: e.target.checked }))}
                className="accent-[#FF6B35]" />
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
                    <input value={editData.name ?? ''}
                      onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))}
                      className={SMALL_INPUT_CLS} />
                    <input type="number" value={editData.price ?? ''}
                      onChange={(e) => setEditData(p => ({ ...p, price: parseInt(e.target.value) }))}
                      className={SMALL_INPUT_CLS} />
                  </div>
                  <textarea rows={2} value={editData.description ?? ''}
                    onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                    className={`w-full ${SMALL_INPUT_CLS} resize-none`} />
                  <div className="flex gap-2">
                    <input placeholder="Rozet" value={editData.badge ?? ''}
                      onChange={(e) => setEditData(p => ({ ...p, badge: e.target.value }))}
                      className={`flex-1 ${SMALL_INPUT_CLS}`} />
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input type="checkbox" checked={editData.is_featured ?? false}
                        onChange={(e) => setEditData(p => ({ ...p, is_featured: e.target.checked }))}
                        className="accent-[#FF6B35]" />
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
              <button onClick={() => toggleActive(pkg)}>
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

  const startEdit = (loc: Location) => { setEditingId(loc.id); setEditData(loc) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const supabase = createClient()
    const { error } = await supabase.from('locations').update({
      name: editData.name, venue: editData.venue,
      weekday_hours: editData.weekday_hours, weekend_hours: editData.weekend_hours,
      maps_url: editData.maps_url,
    }).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setLocations((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Lokasyon güncellendi.')
  }

  const toggleActive = async (loc: Location) => {
    const supabase = createClient()
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
                {([
                  ['Lokasyon Adı', 'name'],
                  ['Mekan Adı', 'venue'],
                  ['Hafta İçi Saat', 'weekday_hours'],
                  ['Hafta Sonu Saat', 'weekend_hours'],
                ] as [string, keyof Location][]).map(([label, field]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                    <input
                      value={(editData[field] as string) ?? ''}
                      onChange={(e) => setEditData(p => ({ ...p, [field]: e.target.value }))}
                      className={`w-full ${SMALL_INPUT_CLS}`}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Google Maps URL</label>
                <input value={editData.maps_url ?? ''}
                  onChange={(e) => setEditData(p => ({ ...p, maps_url: e.target.value }))}
                  className={`w-full ${SMALL_INPUT_CLS}`} />
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

  const startEdit = (f: Feature) => { setEditingId(f.id); setEditData(f) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const supabase = createClient()
    const { error } = await supabase.from('features').update(editData).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setFeatures((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Güncellendi.')
  }

  const deleteF = async (id: string) => {
    const supabase = createClient()
    await supabase.from('features').delete().eq('id', id)
    setFeatures((p) => p.filter((x) => x.id !== id))
    toast.success('Silindi.')
  }

  const toggleActive = async (f: Feature) => {
    const supabase = createClient()
    await supabase.from('features').update({ is_active: !f.is_active }).eq('id', f.id)
    setFeatures((p) => p.map((x) => x.id === f.id ? { ...x, is_active: !f.is_active } : x))
  }

  const addFeature = async () => {
    if (!newF.title) { toast.error('Başlık zorunlu.'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('features').insert({
      title: newF.title, description: newF.description || null,
      icon: newF.icon || null, sort_order: features.length + 1, is_active: true,
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
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">
          <Plus size={14} /> Ekle
        </button>
      </div>
      {showAdd && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex gap-3">
          <input placeholder="Başlık *" value={newF.title}
            onChange={(e) => setNewF(p => ({ ...p, title: e.target.value }))}
            className={`flex-1 ${SMALL_INPUT_CLS}`} />
          <input placeholder="Açıklama" value={newF.description}
            onChange={(e) => setNewF(p => ({ ...p, description: e.target.value }))}
            className={`flex-1 ${SMALL_INPUT_CLS}`} />
          <input placeholder="Lucide icon adı" value={newF.icon}
            onChange={(e) => setNewF(p => ({ ...p, icon: e.target.value }))}
            className={`w-40 ${SMALL_INPUT_CLS}`} />
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
                  <input value={editData.title ?? ''}
                    onChange={(e) => setEditData(p => ({ ...p, title: e.target.value }))}
                    className={`flex-1 ${SMALL_INPUT_CLS}`} />
                  <input value={editData.description ?? ''}
                    onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                    className={`flex-1 ${SMALL_INPUT_CLS}`} />
                  <input value={editData.icon ?? ''} placeholder="icon"
                    onChange={(e) => setEditData(p => ({ ...p, icon: e.target.value }))}
                    className={`w-28 ${SMALL_INPUT_CLS}`} />
                  <button onClick={saveEdit} className="p-2 bg-green-50 text-green-600 rounded-xl"><Check size={15} /></button>
                  <button onClick={cancelEdit} className="p-2 bg-gray-50 text-gray-500 rounded-xl"><X size={15} /></button>
                </div>
              ) : (
                <>
                  <div className="font-semibold text-sm text-[#1B2A4A]">{f.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {f.description} {f.icon && <code className="bg-gray-100 px-1 rounded">{f.icon}</code>}
                  </div>
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

  const startEdit = (c: InfoCard) => { setEditingId(c.id); setEditData(c) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const supabase = createClient()
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
                <input value={editData.title ?? ''}
                  onChange={(e) => setEditData(p => ({ ...p, title: e.target.value }))}
                  className={`w-36 ${SMALL_INPUT_CLS}`} />
                <input value={editData.content ?? ''}
                  onChange={(e) => setEditData(p => ({ ...p, content: e.target.value }))}
                  className={`flex-1 ${SMALL_INPUT_CLS}`} />
                <input value={editData.icon ?? ''} placeholder="icon"
                  onChange={(e) => setEditData(p => ({ ...p, icon: e.target.value }))}
                  className={`w-24 ${SMALL_INPUT_CLS}`} />
                <button onClick={saveEdit} className="p-2 bg-green-50 text-green-600 rounded-xl"><Check size={15} /></button>
                <button onClick={cancelEdit} className="p-2 bg-gray-50 text-gray-500 rounded-xl"><X size={15} /></button>
              </div>
            ) : (
              <>
                <div className="font-semibold text-sm text-[#1B2A4A]">
                  {card.title} {card.icon && <code className="bg-gray-100 text-xs px-1 rounded ml-1">{card.icon}</code>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{card.content}</div>
              </>
            )}
          </div>
          {editingId !== card.id && (
            <button onClick={() => startEdit(card)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 flex-shrink-0">
              <Edit2 size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ===================== FOOTER PANEL =====================
function FooterPanel({ settings: init }: { settings: SiteSettings }) {
  const [s, setS] = useState({ copyright: init.footer_copyright ?? '', links: init.footer_links ?? '[]' })
  const [saving, setSaving] = useState(false)
  const [newLink, setNewLink] = useState({ label: '', url: '' })

  let links: { label: string; url: string }[] = []
  try { links = JSON.parse(s.links) } catch {}

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('site_settings').upsert([
      { key: 'footer_copyright', value: s.copyright, updated_at: new Date().toISOString() },
      { key: 'footer_links', value: s.links, updated_at: new Date().toISOString() },
    ])
    toast.success('Footer kaydedildi.')
    setSaving(false)
  }

  const addLink = () => {
    if (!newLink.label || !newLink.url) return
    const updated = JSON.stringify([...links, newLink])
    setS(p => ({ ...p, links: updated }))
    setNewLink({ label: '', url: '' })
  }

  const removeLink = (i: number) => {
    const updated = JSON.stringify(links.filter((_, idx) => idx !== i))
    setS(p => ({ ...p, links: updated }))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Copyright Metni</label>
        <input type="text" value={s.copyright} onChange={(e) => setS(p => ({ ...p, copyright: e.target.value }))}
          placeholder={`© ${new Date().getFullYear()} Paten İzmir. Tüm hakları saklıdır.`}
          className={INPUT_CLS} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Footer Linkleri</label>
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[#1B2A4A] font-semibold flex-shrink-0">{link.label}</span>
            <span className="text-xs text-gray-400 flex-1 truncate">{link.url}</span>
            <button onClick={() => removeLink(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><X size={14} /></button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 mt-3">
          <input value={newLink.label} onChange={(e) => setNewLink(p => ({ ...p, label: e.target.value }))}
            placeholder="Link metni" className={`w-full sm:w-36 ${SMALL_INPUT_CLS}`} />
          <input value={newLink.url} onChange={(e) => setNewLink(p => ({ ...p, url: e.target.value }))}
            placeholder="https://..." className={`flex-1 min-w-0 ${SMALL_INPUT_CLS}`} />
          <button onClick={addLink} className="w-full sm:w-auto px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold">Ekle</button>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 disabled:opacity-60">
          <Save size={16} />{saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

// ===================== INSTAGRAM + TOGGLES PANEL =====================
function SiteTogglesPanel({ settings: init }: { settings: SiteSettings }) {
  const [s, setS] = useState({
    instagram_show_section: init.instagram_show_section ?? 'false',
    show_reviews: init.show_reviews ?? 'true',
    show_gallery: init.show_gallery ?? 'true',
    group_prerequisite_note: init.group_prerequisite_note ?? '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('site_settings').upsert(
      Object.entries(s).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
    )
    toast.success('Ayarlar kaydedildi.')
    setSaving(false)
  }

  const Toggle = ({ label, k, desc }: { label: string; k: keyof typeof s; desc?: string }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <div className="font-semibold text-sm text-[#1B2A4A]">{label}</div>
        {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => setS(p => ({ ...p, [k]: p[k] === 'true' ? 'false' : 'true' }))}
        className="transition-colors">
        {s[k] === 'true'
          ? <ToggleRight size={28} className="text-green-500" />
          : <ToggleLeft size={28} className="text-gray-300" />}
      </button>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-[#1B2A4A] text-sm">Bölüm Görünürlüğü</h3>
      <Toggle label="Instagram Bölümü" k="instagram_show_section" desc="Sitede Instagram takip bölümü göster" />
      <Toggle label="Yorumlar Bölümü" k="show_reviews" desc="Onaylanan yorumlar sitede görünsün" />
      <Toggle label="Galeri Bölümü" k="show_gallery" desc="Fotoğraf galerisi sitede görünsün" />
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Grup Dersi Ön Koşul Notu</label>
        <textarea rows={3} value={s.group_prerequisite_note}
          onChange={(e) => setS(p => ({ ...p, group_prerequisite_note: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm resize-none"
          placeholder="Grup derslerine katılabilmek için..." />
        <p className="text-xs text-gray-400 mt-1">Boş bırakılırsa paketler sayfasında bu not görünmez.</p>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 disabled:opacity-60">
          <Save size={16} />{saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

// ===================== USERS PANEL =====================
interface AdminUser { email: string; location_filter: string | null }

function UsersPanel({ locations }: { locations: Location[] }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newFilter, setNewFilter] = useState('')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('allowed_emails').select('email, location_filter')
    setUsers((data as AdminUser[]) ?? [])
    setLoaded(true)
  }

  if (!loaded) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <button onClick={load} className="px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">
          Kullanıcıları Yükle
        </button>
      </div>
    )
  }

  const addUser = async () => {
    if (!newEmail) { toast.error('E-posta zorunlu.'); return }
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from('allowed_emails').insert({
      email: newEmail,
      location_filter: newFilter || null,
    })
    if (error) { toast.error('Eklenemedi: ' + error.message); setAdding(false); return }
    setUsers(p => [...p, { email: newEmail, location_filter: newFilter || null }])
    setNewEmail(''); setNewFilter(''); setAdding(false)
    toast.success('Kullanıcı eklendi.')
  }

  const updateFilter = async (email: string, filter: string) => {
    const supabase = createClient()
    await supabase.from('allowed_emails').update({ location_filter: filter || null }).eq('email', email)
    setUsers(p => p.map(u => u.email === email ? { ...u, location_filter: filter || null } : u))
    toast.success('Kısıt güncellendi.')
  }

  const removeUser = async (email: string) => {
    const supabase = createClient()
    await supabase.from('allowed_emails').delete().eq('email', email)
    setUsers(p => p.filter(u => u.email !== email))
    toast.success('Kullanıcı silindi.')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-[#1B2A4A]">Admin Kullanıcıları</h3>
        <p className="text-xs text-gray-400 mt-0.5">Lokasyon kısıtı olan kullanıcılar sadece o lokasyona ait başvuruları görür.</p>
      </div>

      {/* Mevcut kullanıcılar */}
      <div className="divide-y divide-gray-50">
        {users.map((u) => (
          <div key={u.email} className="px-6 py-4 flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm text-[#1B2A4A] flex-1 min-w-48">{u.email}</span>
            <select
              defaultValue={u.location_filter ?? ''}
              onChange={(e) => updateFilter(u.email, e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white"
            >
              <option value="">Tam Erişim</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name} Sadece</option>)}
            </select>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${u.location_filter ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {u.location_filter ? `${u.location_filter} kısıtlı` : 'Tam Erişim'}
            </span>
            <button onClick={() => removeUser(u.email)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Yeni kullanıcı ekle */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <div className="text-xs font-semibold text-gray-500 mb-3">Yeni Kullanıcı Ekle</div>
        <div className="flex flex-wrap gap-2">
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder="E-posta adresi *" type="email"
            className={`flex-1 min-w-48 ${SMALL_INPUT_CLS}`} />
          <select value={newFilter} onChange={(e) => setNewFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white">
            <option value="">Tam Erişim</option>
            {locations.map(l => <option key={l.id} value={l.name}>{l.name} Sadece</option>)}
          </select>
          <button onClick={addUser} disabled={adding}
            className="px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 disabled:opacity-60">
            {adding ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">⚠️ Eklenen kullanıcının Supabase Authentication&apos;da da hesabı olmalı.</p>
      </div>
    </div>
  )
}

// ===================== MAIN COMPONENT =====================
interface Props {
  settings: SiteSettings
  packages: Package[]
  locations: Location[]
  features: Feature[]
  infoCards: InfoCard[]
  galleryImages: GalleryImage[]
}

type Tab = 'settings' | 'packages' | 'locations' | 'features' | 'info_cards' | 'footer' | 'toggles' | 'gallery' | 'users'

const TABS: { key: Tab; label: string }[] = [
  { key: 'settings', label: '⚙️ Site Ayarları' },
  { key: 'packages', label: '📦 Paketler' },
  { key: 'locations', label: '📍 Lokasyonlar' },
  { key: 'features', label: '✨ Özellikler' },
  { key: 'info_cards', label: '🃏 Bilgi Kartları' },
  { key: 'footer', label: '📄 Footer' },
  { key: 'toggles', label: '🔘 Bölümler' },
  { key: 'gallery', label: '🖼 Galeri' },
  { key: 'users', label: '👤 Kullanıcılar' },
]

export default function ContentClient({
  settings: initialSettings,
  packages: initialPackages,
  locations: initialLocations,
  features: initialFeatures,
  infoCards: initialInfoCards,
  galleryImages,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('settings')

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t.key ? 'bg-[#FF6B35] text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && <SiteSettingsPanel settings={initialSettings} />}
      {activeTab === 'packages' && <PackagesPanel packages={initialPackages} />}
      {activeTab === 'locations' && <LocationsPanel locations={initialLocations} />}
      {activeTab === 'features' && <FeaturesPanel features={initialFeatures} />}
      {activeTab === 'info_cards' && <InfoCardsPanel infoCards={initialInfoCards} />}
      {activeTab === 'footer' && <FooterPanel settings={initialSettings} />}
      {activeTab === 'toggles' && <SiteTogglesPanel settings={initialSettings} />}
      {activeTab === 'gallery' && <GalleryManager images={galleryImages} />}
      {activeTab === 'users' && <UsersPanel locations={initialLocations} />}
    </div>
  )
}
