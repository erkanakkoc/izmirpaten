'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import type { Review, Package } from '@/types'
import { toast } from 'sonner'

interface ReviewsSectionProps {
  reviews: Review[]
  packages: Package[]
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange?.(s)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={20} className={s <= value ? 'fill-[#FF6B35] text-[#FF6B35]' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsSection({ reviews, packages }: ReviewsSectionProps) {
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', rating: 5, comment: '', package_name: '' })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startAuto = () => {
    if (reviews.length <= 1) return
    intervalRef.current = setInterval(() => setCurrent((c) => (c + 1) % reviews.length), 5000)
  }
  const stopAuto = () => { if (intervalRef.current) clearInterval(intervalRef.current) }

  useEffect(() => { startAuto(); return stopAuto }, [reviews.length])

  const prev = () => { stopAuto(); setCurrent((c) => (c - 1 + reviews.length) % reviews.length); startAuto() }
  const next = () => { stopAuto(); setCurrent((c) => (c + 1) % reviews.length); startAuto() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.comment.trim() || !form.name.trim()) { toast.error('Ad ve yorum zorunludur.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      toast.error('Yorum gönderilemedi. Tekrar dene.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="yorumlar" className="py-24 bg-gradient-to-br from-gray-50 to-orange-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block text-[#FF6B35] font-bold text-sm uppercase tracking-widest mb-3">Yorumlar</span>
          <h2 className="text-4xl font-extrabold text-[#1B2A4A] mb-4">Öğrenciler Ne Diyor?</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Carousel */}
          {reviews.length > 0 && (
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl min-h-48">
                <StarRating value={reviews[current].rating} />
                <p className="text-gray-600 text-lg leading-relaxed my-5 italic">
                  &ldquo;{reviews[current].comment}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                    {reviews[current].name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[#1B2A4A] text-sm">{reviews[current].name}</div>
                    {reviews[current].package_name && (
                      <div className="text-xs text-gray-400">{reviews[current].package_name}</div>
                    )}
                  </div>
                </div>
              </div>

              {reviews.length > 1 && (
                <div className="flex items-center justify-between mt-5">
                  <button onClick={prev} className="p-2 rounded-xl bg-white shadow hover:shadow-md transition-all">
                    <ChevronLeft size={20} className="text-[#1B2A4A]" />
                  </button>
                  <div className="flex gap-2">
                    {reviews.map((_, i) => (
                      <button key={i} onClick={() => { stopAuto(); setCurrent(i); startAuto() }}
                        className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-[#FF6B35] w-5' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                  <button onClick={next} className="p-2 rounded-xl bg-white shadow hover:shadow-md transition-all">
                    <ChevronRight size={20} className="text-[#1B2A4A]" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Review form */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-extrabold text-[#1B2A4A] mb-2">Teşekkürler!</h3>
                <p className="text-gray-500 text-sm">Yorumun incelendikten sonra yayınlanacak.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-extrabold text-[#1B2A4A] mb-5">Yorum Bırak</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adın *</label>
                      <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Adın Soyadın" required
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paket</label>
                      <select value={form.package_name} onChange={(e) => setForm(p => ({ ...p, package_name: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white">
                        <option value="">Seç (opsiyonel)</option>
                        {packages.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Puanın</label>
                    <StarRating value={form.rating} onChange={(v) => setForm(p => ({ ...p, rating: v }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yorumun *</label>
                    <textarea value={form.comment} onChange={(e) => setForm(p => ({ ...p, comment: e.target.value }))}
                      rows={4} required placeholder="Derslerle ilgili düşüncelerini paylaş..."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-60">
                    <Send size={16} />
                    {submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
