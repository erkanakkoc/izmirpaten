'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage({ email }: { email: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2A4A] to-[#2d4a8a] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldX size={32} className="text-red-500" />
        </div>
        <h1 className="text-xl font-extrabold text-[#1B2A4A] mb-2">Erişim Reddedildi</h1>
        <p className="text-gray-500 text-sm mb-1">
          <span className="font-semibold text-gray-700">{email}</span> hesabının admin paneline erişim izni yok.
        </p>
        <p className="text-gray-400 text-xs mb-7">
          Supabase &rarr; SQL Editor&apos;da şunu çalıştır:<br />
          <code className="bg-gray-100 px-2 py-1 rounded text-xs mt-1 inline-block">
            INSERT INTO allowed_emails (email) VALUES (&apos;{email}&apos;);
          </code>
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-orange-500 transition-all"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}
