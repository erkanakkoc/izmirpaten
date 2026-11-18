'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2, GripVertical, ToggleLeft, ToggleRight, Edit2, Check, X } from 'lucide-react'
import type { Package, Location, Feature, InfoCard, SiteSettings, GalleryImage, Discipline, LocationDiscipline } from '@/types'
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
function PackagesPanel({ packages: init, disciplines }: { packages: Package[]; disciplines: Discipline[] }) {
  const [packages, setPackages] = useState<Package[]>(init)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Package>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all')
  const [newPkg, setNewPkg] = useState({
    name: '', price: '', description: '', badge: '', is_featured: false,
    discipline_id: disciplines[0]?.id ?? '',
  })

  const disciplineName = (id: string) => disciplines.find((d) => d.id === id)?.name ?? '—'
  const visiblePackages = filterDiscipline === 'all' ? packages : packages.filter((p) => p.discipline_id === filterDiscipline)

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
      discipline_id: editData.discipline_id,
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
    if (!newPkg.discipline_id) { toast.error('Lütfen bir branş seçin.'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('packages').insert({
      name: newPkg.name, price: parseInt(newPkg.price),
      description: newPkg.description || null, badge: newPkg.badge || null,
      is_featured: newPkg.is_featured, is_active: true, sort_order: packages.length + 1,
      discipline_id: newPkg.discipline_id,
    }).select().single()
    if (error) { toast.error('Eklenemedi.'); return }
    setPackages((p) => [...p, data])
    setNewPkg({ name: '', price: '', description: '', badge: '', is_featured: false, discipline_id: disciplines[0]?.id ?? '' })
    setShowAdd(false)
    toast.success('Paket eklendi.')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <span className="font-bold text-[#1B2A4A]">{visiblePackages.length} Paket</span>
        <div className="flex items-center gap-2">
          <select value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)}
            className={SMALL_INPUT_CLS}>
            <option value="all">Tüm branşlar</option>
            {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all">
            <Plus size={15} /> Yeni Paket
          </button>
        </div>
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
          <select value={newPkg.discipline_id} onChange={(e) => setNewPkg(p => ({ ...p, discipline_id: e.target.value }))}
            className={`w-full ${SMALL_INPUT_CLS} mb-3`}>
            <option value="">Branş seçin *</option>
            {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
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
        {visiblePackages.map((pkg) => (
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
                  <select value={editData.discipline_id ?? ''}
                    onChange={(e) => setEditData(p => ({ ...p, discipline_id: e.target.value }))}
                    className={`w-full ${SMALL_INPUT_CLS}`}>
                    {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
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
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{disciplineName(pkg.discipline_id)}</span>
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
function LocationsPanel({ locations: init, disciplines, locationDisciplines: initLd }: {
  locations: Location[]; disciplines: Discipline[]; locationDisciplines: LocationDiscipline[]
}) {
  const [locations, setLocations] = useState<Location[]>(init)
  const [locationDisciplines, setLocationDisciplines] = useState<LocationDiscipline[]>(initLd)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Location>>({})
  const [editDisciplineIds, setEditDisciplineIds] = useState<string[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newLoc, setNewLoc] = useState({ name: '', venue: '', weekday_hours: '', weekend_hours: '', maps_url: '' })
  const [newLocDisciplineIds, setNewLocDisciplineIds] = useState<string[]>([])

  const disciplinesForLocation = (locationId: string) =>
    locationDisciplines.filter((ld) => ld.location_id === locationId)
      .map((ld) => disciplines.find((d) => d.id === ld.discipline_id)?.name)
      .filter(Boolean) as string[]

  const startEdit = (loc: Location) => {
    setEditingId(loc.id)
    setEditData(loc)
    setEditDisciplineIds(locationDisciplines.filter((ld) => ld.location_id === loc.id).map((ld) => ld.discipline_id))
  }
  const cancelEdit = () => { setEditingId(null); setEditData({}); setEditDisciplineIds([]) }

  const toggleEditDiscipline = (id: string) => {
    setEditDisciplineIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  }
  const toggleNewLocDiscipline = (id: string) => {
    setNewLocDisciplineIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  }

  const saveEdit = async () => {
    if (!editingId) return
    const supabase = createClient()
    const { error } = await supabase.from('locations').update({
      name: editData.name, venue: editData.venue,
      weekday_hours: editData.weekday_hours, weekend_hours: editData.weekend_hours,
      maps_url: editData.maps_url,
    }).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }

    await supabase.from('location_disciplines').delete().eq('location_id', editingId)
    if (editDisciplineIds.length > 0) {
      await supabase.from('location_disciplines').insert(
        editDisciplineIds.map((discipline_id) => ({ location_id: editingId, discipline_id }))
      )
    }
    setLocations((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    setLocationDisciplines((p) => [
      ...p.filter((ld) => ld.location_id !== editingId),
      ...editDisciplineIds.map((discipline_id) => ({ location_id: editingId, discipline_id, created_at: new Date().toISOString() })),
    ])
    cancelEdit()
    toast.success('Lokasyon güncellendi.')
  }

  const toggleActive = async (loc: Location) => {
    const supabase = createClient()
    await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', loc.id)
    setLocations((p) => p.map((x) => x.id === loc.id ? { ...x, is_active: !loc.is_active } : x))
  }

  const addLocation = async () => {
    if (!newLoc.name || !newLoc.venue) { toast.error('Lokasyon adı ve mekan zorunlu.'); return }
    if (newLocDisciplineIds.length === 0) { toast.error('En az bir branş seçin.'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('locations').insert({
      name: newLoc.name, venue: newLoc.venue,
      weekday_hours: newLoc.weekday_hours || null, weekend_hours: newLoc.weekend_hours || null,
      maps_url: newLoc.maps_url || null, is_active: true,
    }).select().single()
    if (error) { toast.error('Eklenemedi.'); return }
    await supabase.from('location_disciplines').insert(
      newLocDisciplineIds.map((discipline_id) => ({ location_id: data.id, discipline_id }))
    )
    setLocations((p) => [...p, data])
    setLocationDisciplines((p) => [
      ...p,
      ...newLocDisciplineIds.map((discipline_id) => ({ location_id: data.id, discipline_id, created_at: new Date().toISOString() })),
    ])
    setNewLoc({ name: '', venue: '', weekday_hours: '', weekend_hours: '', maps_url: '' })
    setNewLocDisciplineIds([])
    setShowAdd(false)
    toast.success('Lokasyon eklendi.')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-[#1B2A4A]">{locations.length} Lokasyon</span>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all">
          <Plus size={15} /> Yeni Lokasyon
        </button>
      </div>

      {showAdd && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Lokasyon adı *" value={newLoc.name}
              onChange={(e) => setNewLoc(p => ({ ...p, name: e.target.value }))} className={SMALL_INPUT_CLS} />
            <input placeholder="Mekan adı *" value={newLoc.venue}
              onChange={(e) => setNewLoc(p => ({ ...p, venue: e.target.value }))} className={SMALL_INPUT_CLS} />
            <input placeholder="Hafta içi saat" value={newLoc.weekday_hours}
              onChange={(e) => setNewLoc(p => ({ ...p, weekday_hours: e.target.value }))} className={SMALL_INPUT_CLS} />
            <input placeholder="Hafta sonu saat" value={newLoc.weekend_hours}
              onChange={(e) => setNewLoc(p => ({ ...p, weekend_hours: e.target.value }))} className={SMALL_INPUT_CLS} />
          </div>
          <input placeholder="Google Maps URL" value={newLoc.maps_url}
            onChange={(e) => setNewLoc(p => ({ ...p, maps_url: e.target.value }))} className={`w-full ${SMALL_INPUT_CLS}`} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hangi branşlarda kullanılıyor? *</label>
            <div className="flex flex-wrap gap-2">
              {disciplines.map((d) => (
                <label key={d.id} className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer">
                  <input type="checkbox" checked={newLocDisciplineIds.includes(d.id)}
                    onChange={() => toggleNewLocDiscipline(d.id)} className="accent-[#FF6B35]" />
                  {d.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addLocation} className="px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">Ekle</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">İptal</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
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
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hangi branşlarda kullanılıyor?</label>
                  <div className="flex flex-wrap gap-2">
                    {disciplines.map((d) => (
                      <label key={d.id} className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer">
                        <input type="checkbox" checked={editDisciplineIds.includes(d.id)}
                          onChange={() => toggleEditDiscipline(d.id)} className="accent-[#FF6B35]" />
                        {d.name}
                      </label>
                    ))}
                  </div>
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-[#1B2A4A]">{loc.name}</span>
                    <span className="text-gray-400 text-sm">– {loc.venue}</span>
                    {disciplinesForLocation(loc.id).map((name) => (
                      <span key={name} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{name}</span>
                    ))}
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

// ===================== DISCIPLINES =====================
function DisciplinesPanel({ disciplines: init }: { disciplines: Discipline[] }) {
  const [disciplines, setDisciplines] = useState<Discipline[]>(init)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Discipline>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newD, setNewD] = useState({
    name: '', slug: '', description: '', icon: '',
    lesson_duration_minutes: '40', max_group_size: '5', equipment_note: '',
  })

  const startEdit = (d: Discipline) => { setEditingId(d.id); setEditData(d) }
  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    const supabase = createClient()
    const { error } = await supabase.from('disciplines').update({
      name: editData.name, description: editData.description, icon: editData.icon,
      cover_image_url: editData.cover_image_url,
      lesson_duration_minutes: editData.lesson_duration_minutes,
      max_group_size: editData.max_group_size,
      equipment_note: editData.equipment_note,
    }).eq('id', editingId)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setDisciplines((p) => p.map((x) => x.id === editingId ? { ...x, ...editData } : x))
    cancelEdit()
    toast.success('Branş güncellendi.')
  }

  const toggleActive = async (d: Discipline) => {
    const supabase = createClient()
    const { error } = await supabase.from('disciplines').update({ is_active: !d.is_active }).eq('id', d.id)
    if (error) { toast.error('Güncellenemedi.'); return }
    setDisciplines((p) => p.map((x) => x.id === d.id ? { ...x, is_active: !d.is_active } : x))
  }

  const addDiscipline = async () => {
    if (!newD.name) { toast.error('Branş adı zorunlu.'); return }
    const slug = newD.slug || newD.name.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const supabase = createClient()
    const { data, error } = await supabase.from('disciplines').insert({
      name: newD.name, slug,
      description: newD.description || null, icon: newD.icon || null,
      lesson_duration_minutes: parseInt(newD.lesson_duration_minutes) || 40,
      max_group_size: parseInt(newD.max_group_size) || 5,
      equipment_note: newD.equipment_note || null,
      is_active: false, sort_order: disciplines.length,
    }).select().single()
    if (error) { toast.error(`Eklenemedi: ${error.message}`); return }
    setDisciplines((p) => [...p, data])
    setNewD({ name: '', slug: '', description: '', icon: '', lesson_duration_minutes: '40', max_group_size: '5', equipment_note: '' })
    setShowAdd(false)
    toast.success('Branş eklendi (pasif). Paket/lokasyon ekledikten sonra aktif edebilirsiniz.')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-[#1B2A4A]">{disciplines.length} Branş</span>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all">
          <Plus size={15} /> Yeni Branş
        </button>
      </div>

      {showAdd && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Branş adı * (ör: Buz Pateni)" value={newD.name}
              onChange={(e) => setNewD(p => ({ ...p, name: e.target.value }))} className={SMALL_INPUT_CLS} />
            <input placeholder="İkon adı (Lucide, ör: Snowflake)" value={newD.icon}
              onChange={(e) => setNewD(p => ({ ...p, icon: e.target.value }))} className={SMALL_INPUT_CLS} />
            <input placeholder="Ders süresi (dk)" type="number" value={newD.lesson_duration_minutes}
              onChange={(e) => setNewD(p => ({ ...p, lesson_duration_minutes: e.target.value }))} className={SMALL_INPUT_CLS} />
            <input placeholder="Max grup büyüklüğü" type="number" value={newD.max_group_size}
              onChange={(e) => setNewD(p => ({ ...p, max_group_size: e.target.value }))} className={SMALL_INPUT_CLS} />
          </div>
          <textarea placeholder="Açıklama" rows={2} value={newD.description}
            onChange={(e) => setNewD(p => ({ ...p, description: e.target.value }))}
            className={`w-full ${SMALL_INPUT_CLS} resize-none`} />
          <input placeholder="Ekipman notu (ör: Paten kendin getirmelisin)" value={newD.equipment_note}
            onChange={(e) => setNewD(p => ({ ...p, equipment_note: e.target.value }))} className={`w-full ${SMALL_INPUT_CLS}`} />
          <div className="flex gap-2">
            <button onClick={addDiscipline} className="px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">Ekle</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">İptal</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {disciplines.map((d) => (
          <div key={d.id} className="px-6 py-5">
            {editingId === d.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={editData.name ?? ''} onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))} className={SMALL_INPUT_CLS} placeholder="Branş adı" />
                  <input value={editData.icon ?? ''} onChange={(e) => setEditData(p => ({ ...p, icon: e.target.value }))} className={SMALL_INPUT_CLS} placeholder="İkon adı" />
                  <input type="number" value={editData.lesson_duration_minutes ?? ''} onChange={(e) => setEditData(p => ({ ...p, lesson_duration_minutes: parseInt(e.target.value) }))} className={SMALL_INPUT_CLS} placeholder="Ders süresi (dk)" />
                  <input type="number" value={editData.max_group_size ?? ''} onChange={(e) => setEditData(p => ({ ...p, max_group_size: parseInt(e.target.value) }))} className={SMALL_INPUT_CLS} placeholder="Max grup" />
                </div>
                <textarea rows={2} value={editData.description ?? ''} onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))} className={`w-full ${SMALL_INPUT_CLS} resize-none`} placeholder="Açıklama" />
                <input value={editData.equipment_note ?? ''} onChange={(e) => setEditData(p => ({ ...p, equipment_note: e.target.value }))} className={`w-full ${SMALL_INPUT_CLS}`} placeholder="Ekipman notu" />
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
                    <span className="font-bold text-[#1B2A4A]">{d.name}</span>
                    <span className="text-xs text-gray-400">({d.slug})</span>
                    {!d.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Pasif</span>}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>Ders süresi: {d.lesson_duration_minutes} dk • Max grup: {d.max_group_size}</div>
                    {d.equipment_note && <div>Ekipman: {d.equipment_note}</div>}
                    {d.description && <div className="text-gray-400">{d.description}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(d)}>
                    {d.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-gray-400" />}
                  </button>
                  <button onClick={() => startEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 size={15} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
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
  disciplines: Discipline[]
  locationDisciplines: LocationDiscipline[]
}

type Tab = 'settings' | 'disciplines' | 'packages' | 'locations' | 'features' | 'info_cards' | 'footer' | 'toggles' | 'gallery' | 'users'

const TABS: { key: Tab; label: string }[] = [
  { key: 'settings', label: '⚙️ Site Ayarları' },
  { key: 'disciplines', label: '🏅 Branşlar' },
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
  disciplines: initialDisciplines,
  locationDisciplines: initialLocationDisciplines,
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
      {activeTab === 'disciplines' && <DisciplinesPanel disciplines={initialDisciplines} />}
      {activeTab === 'packages' && <PackagesPanel packages={initialPackages} disciplines={initialDisciplines} />}
      {activeTab === 'locations' && <LocationsPanel locations={initialLocations} disciplines={initialDisciplines} locationDisciplines={initialLocationDisciplines} />}
      {activeTab === 'features' && <FeaturesPanel features={initialFeatures} />}
      {activeTab === 'info_cards' && <InfoCardsPanel infoCards={initialInfoCards} />}
      {activeTab === 'footer' && <FooterPanel settings={initialSettings} />}
      {activeTab === 'toggles' && <SiteTogglesPanel settings={initialSettings} />}
      {activeTab === 'gallery' && <GalleryManager images={galleryImages} />}
      {activeTab === 'users' && <UsersPanel locations={initialLocations} />}
    </div>
  )
}
