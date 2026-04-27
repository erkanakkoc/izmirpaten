'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, X, Star, Trash2 } from 'lucide-react'
import type { Review } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props { initialReviews: Review[] }

export default function ReviewsManager({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  const filtered = reviews.filter((r) =>
    filter === 'all' ? true : filter === 'pending' ? !r.is_approved : r.is_approved
  )

  const approve = async (id: string, approved: boolean) => {
    const supabase = createClient()
    const { error } = await supabase.from('reviews').update({ is_approved: approved }).eq('id', id)
    if (error) { toast.error('Güncelleme başarısız.'); return }
    setReviews((p) => p.map((r) => r.id === id ? { ...r, is_approved: approved } : r))
    toast.success(approved ? 'Yorum onaylandı.' : 'Yorum gizlendi.')
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) { toast.error('Silinemedi.'); return }
    setReviews((p) => p.filter((r) => r.id !== id))
    toast.success('Yorum silindi.')
  }

  const pending = reviews.filter((r) => !r.is_approved).length

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {([
          ['all', 'Tümü', reviews.length],
          ['pending', 'Bekleyenler', pending],
          ['approved', 'Onaylananlar', reviews.length - pending],
        ] as [typeof filter, string, number][]).map(([key, label, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === key ? 'bg-[#FF6B35] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-200'
            }`}>
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === key ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((review) => (
          <div key={review.id} className={`bg-white rounded-2xl border-2 p-5 transition-all ${
            review.is_approved ? 'border-green-100' : 'border-amber-100'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-bold text-[#1B2A4A]">{review.name}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={14} className={s <= review.rating ? 'fill-[#FF6B35] text-[#FF6B35]' : 'text-gray-200'} />
                    ))}
                  </div>
                  {review.package_name && (
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{review.package_name}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${review.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {review.is_approved ? 'Onaylı' : 'Beklemede'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(review.created_at)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {review.is_approved ? (
                  <button onClick={() => approve(review.id, false)} title="Gizle"
                    className="p-2 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors">
                    <X size={16} />
                  </button>
                ) : (
                  <button onClick={() => approve(review.id, true)} title="Onayla"
                    className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                    <Check size={16} />
                  </button>
                )}
                <button onClick={() => remove(review.id)} title="Sil"
                  className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            {filter === 'pending' ? 'Bekleyen yorum yok.' : 'Yorum bulunamadı.'}
          </div>
        )}
      </div>
    </div>
  )
}
