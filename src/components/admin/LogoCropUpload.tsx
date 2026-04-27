'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Check, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  currentUrl?: string
  onComplete: (url: string) => void
}

function centerAspectCrop(width: number, height: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, width / height, width, height),
    width,
    height
  )
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0,
    canvas.width, canvas.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas boş')), 'image/png', 1)
  })
}

export default function LogoCropUpload({ currentUrl, onComplete }: Props) {
  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [uploading, setUploading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Sadece resim dosyası seçebilirsin.'); return }
    const reader = new FileReader()
    reader.onload = () => setSrcUrl(reader.result as string)
    reader.readAsDataURL(file)
    // input'u sıfırla — aynı dosyayı tekrar seçmeye izin ver
    e.target.value = ''
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height))
  }, [])

  const handleCropAndUpload = async () => {
    if (!imgRef.current || !completedCrop) {
      toast.error('Lütfen kırpma alanını seçin.')
      return
    }
    setUploading(true)
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop)
      const supabase = createClient()
      const fileName = `logo_${Date.now()}.png`
      const { error } = await supabase.storage
        .from('assets')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName)
      onComplete(publicUrl)
      setSrcUrl(null)
      toast.success('Logo yüklendi!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Bilinmeyen hata'
      console.error('Storage upload error:', err)
      toast.error(`Yükleme başarısız: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setSrcUrl(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  return (
    <div>
      {/* Mevcut logo + yükleme butonu */}
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="flex-shrink-0 h-12 w-auto max-w-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="Mevcut logo" className="max-h-10 w-auto object-contain" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
            <ImageIcon size={20} className="text-gray-300" />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#FF6B35]/40 text-[#FF6B35] rounded-xl text-sm font-semibold hover:bg-orange-50 hover:border-[#FF6B35] transition-all"
        >
          <Upload size={15} />
          Resim Seç & Kırp
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* Kırpma modalı */}
      {srcUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-[#1B2A4A]">Logo Kırp</h3>
                <p className="text-xs text-gray-400 mt-0.5">Logoyu görmek istediğin alanı seç</p>
              </div>
              <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Crop alanı */}
            <div className="p-6 flex items-center justify-center bg-gray-50 max-h-[60vh] overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                minWidth={20}
                minHeight={20}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={srcUrl}
                  alt="Kırpılacak resim"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </ReactCrop>
            </div>

            {/* Önizleme + butonlar */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
              <div>
                {completedCrop && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Seçim: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} px</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleCropAndUpload}
                  disabled={uploading || !completedCrop}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? <><Loader2 size={15} className="animate-spin" /> Yükleniyor...</>
                    : <><Check size={15} /> Kırp ve Kaydet</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
