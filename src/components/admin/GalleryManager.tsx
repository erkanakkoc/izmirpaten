'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Upload, Trash2, ToggleLeft, ToggleRight, GripVertical, Loader2 } from 'lucide-react'
import type { GalleryImage } from '@/types'

interface Props { images: GalleryImage[] }

export default function GalleryManager({ images: init }: Props) {
  const [images, setImages] = useState<GalleryImage[]>(init)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const supabase = createClient()
    for (const file of files) {
      const fileName = `gallery_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { error } = await supabase.storage.from('assets').upload(fileName, file, { upsert: true })
      if (error) { toast.error(`${file.name} yüklenemedi.`); continue }
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName)
      const { data, error: dbErr } = await supabase.from('gallery_images').insert({
        url: publicUrl, alt: file.name.replace(/\.[^.]+$/, ''), sort_order: images.length + 1, is_active: true,
      }).select().single()
      if (dbErr) { toast.error('Veritabanına kaydedilemedi.'); continue }
      setImages((p) => [...p, data])
    }
    toast.success('Görseller yüklendi.')
    setUploading(false)
    e.target.value = ''
  }

  const toggleActive = async (img: GalleryImage) => {
    const supabase = createClient()
    await supabase.from('gallery_images').update({ is_active: !img.is_active }).eq('id', img.id)
    setImages((p) => p.map((x) => x.id === img.id ? { ...x, is_active: !img.is_active } : x))
  }

  const remove = async (img: GalleryImage) => {
    const supabase = createClient()
    await supabase.from('gallery_images').delete().eq('id', img.id)
    setImages((p) => p.filter((x) => x.id !== img.id))
    toast.success('Görsel silindi.')
  }

  const updateAlt = async (id: string, alt: string) => {
    const supabase = createClient()
    await supabase.from('gallery_images').update({ alt }).eq('id', id)
    setImages((p) => p.map((x) => x.id === id ? { ...x, alt } : x))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-[#1B2A4A]">{images.length} Görsel</span>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all disabled:opacity-60">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Yükleniyor...' : 'Görsel Ekle'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      </div>

      {images.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <Upload size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz görsel yok. Yukarıdan ekle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {images.map((img) => (
            <div key={img.id} className={`relative rounded-2xl overflow-hidden border-2 transition-all ${img.is_active ? 'border-green-200' : 'border-gray-100 opacity-60'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ''} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-all flex flex-col justify-end p-2 gap-1.5">
                <input
                  defaultValue={img.alt ?? ''}
                  onBlur={(e) => updateAlt(img.id, e.target.value)}
                  placeholder="Alt metin"
                  className="w-full px-2 py-1 text-xs bg-white/90 rounded-lg focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-1.5">
                  <button onClick={() => toggleActive(img)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 bg-white/90 rounded-lg text-xs font-semibold text-gray-700">
                    {img.is_active ? <ToggleRight size={14} className="text-green-500" /> : <ToggleLeft size={14} />}
                    {img.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                  <button onClick={() => remove(img)} className="p-1 bg-red-500 text-white rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <GripVertical size={16} className="text-white/70 cursor-grab" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
