import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, rating, comment, package_name } = await request.json()
    if (!name || !comment) return NextResponse.json({ error: 'Ad ve yorum zorunludur.' }, { status: 400 })

    const supabase = await createServiceClient()
    const { error } = await supabase.from('reviews').insert({
      name, rating: rating ?? 5, comment, package_name: package_name || null, is_approved: false,
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
