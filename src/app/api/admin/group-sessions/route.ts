import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Europe/Istanbul, DST uygulanmıyor (2016'dan beri sabit UTC+3)
function toIstanbulTimestamp(sessionDate: string, slotHour: number) {
  return `${sessionDate}T${String(slotHour).padStart(2, '0')}:00:00+03:00`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const body = await req.json()
  const { action } = body
  const service = await createServiceClient()

  if (action === 'create') {
    const { discipline_id, location_id, session_date, slot_hour, max_participants } = body
    if (!discipline_id || !location_id || !session_date || slot_hour === undefined || !max_participants) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })
    }
    const { data, error } = await service.from('group_sessions').insert({
      discipline_id, location_id, session_date, slot_hour: parseInt(slot_hour),
      max_participants: parseInt(max_participants), status: 'open',
    }).select('*, locations(name, venue)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, session: data })
  }

  if (action === 'approve_applicant') {
    const { application_id, group_session_id } = body
    if (!application_id || !group_session_id) return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })

    const { data: groupSession } = await service.from('group_sessions').select('*').eq('id', group_session_id).single()
    if (!groupSession) return NextResponse.json({ error: 'Grup oturumu bulunamadı.' }, { status: 404 })
    if (groupSession.status !== 'open') return NextResponse.json({ error: 'Bu oturum artık açık değil.' }, { status: 400 })

    const { count: approvedCount } = await service.from('group_session_participants')
      .select('id', { count: 'exact', head: true }).eq('group_session_id', group_session_id).eq('status', 'approved')
    if ((approvedCount ?? 0) >= groupSession.max_participants) {
      return NextResponse.json({ error: 'Kontenjan dolu.' }, { status: 400 })
    }

    const { data: existing } = await service.from('group_session_participants')
      .select('id').eq('application_id', application_id).eq('group_session_id', group_session_id).maybeSingle()
    if (existing) {
      await service.from('group_session_participants').update({ status: 'approved' }).eq('id', existing.id)
    } else {
      await service.from('group_session_participants').insert({
        group_session_id, application_id, status: 'approved',
      })
    }
    await service.from('applications').update({ status: 'approved' }).eq('id', application_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'reject_applicant') {
    const { application_id, group_session_id } = body
    if (!application_id || !group_session_id) return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })

    const { data: existing } = await service.from('group_session_participants')
      .select('id').eq('application_id', application_id).eq('group_session_id', group_session_id).maybeSingle()
    if (existing) {
      await service.from('group_session_participants').update({ status: 'rejected' }).eq('id', existing.id)
    }
    await service.from('applications').update({ status: 'rejected' }).eq('id', application_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'assign_trainer') {
    const { group_session_id, trainer_id } = body
    if (!group_session_id || !trainer_id) return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })

    const { data: groupSession } = await service.from('group_sessions').select('*').eq('id', group_session_id).single()
    if (!groupSession) return NextResponse.json({ error: 'Grup oturumu bulunamadı.' }, { status: 404 })
    if (groupSession.status !== 'open') return NextResponse.json({ error: 'Bu oturuma zaten eğitmen atanmış ya da oturum kapalı.' }, { status: 400 })

    const { data: eligible } = await service.from('trainer_disciplines')
      .select('trainer_id').eq('trainer_id', trainer_id).eq('discipline_id', groupSession.discipline_id).maybeSingle()
    if (!eligible) return NextResponse.json({ error: 'Bu eğitmen seçili branşa atanmamış.' }, { status: 400 })

    const { data: discipline } = await service.from('disciplines').select('lesson_duration_minutes').eq('id', groupSession.discipline_id).single()

    const { data: lesson, error: lessonError } = await service.from('lessons').insert({
      trainer_id, discipline_id: groupSession.discipline_id, location_id: groupSession.location_id,
      scheduled_at: toIstanbulTimestamp(groupSession.session_date, groupSession.slot_hour),
      duration_minutes: discipline?.lesson_duration_minutes ?? 40,
      status: 'approved', group_session_id,
      student_id: null, enrollment_id: null,
    }).select().single()

    if (lessonError) {
      if (lessonError.code === '23505') {
        return NextResponse.json({ error: 'Bu eğitmenin o saatte zaten başka bir dersi var.' }, { status: 409 })
      }
      return NextResponse.json({ error: lessonError.message }, { status: 400 })
    }

    await service.from('group_sessions').update({
      trainer_id, lesson_id: lesson.id, status: 'confirmed',
    }).eq('id', group_session_id)

    return NextResponse.json({ success: true, lesson })
  }

  if (action === 'cancel') {
    const { group_session_id } = body
    if (!group_session_id) return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })

    const { data: groupSession } = await service.from('group_sessions').select('lesson_id').eq('id', group_session_id).single()
    if (groupSession?.lesson_id) {
      await service.from('lessons').update({ status: 'cancelled' }).eq('id', groupSession.lesson_id)
    }
    await service.from('group_sessions').update({ status: 'cancelled' }).eq('id', group_session_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
}
