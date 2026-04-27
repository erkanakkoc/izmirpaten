import { createClient } from '@/lib/supabase/server'
import ReviewsManager from '@/components/admin/ReviewsManager'

export const revalidate = 0

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Yorumlar</h1>
        <p className="text-gray-500 text-sm mt-1">Gelen yorumları onayla veya reddet. Onaylananlar sitede görünür.</p>
      </div>
      <ReviewsManager initialReviews={reviews ?? []} />
    </div>
  )
}
