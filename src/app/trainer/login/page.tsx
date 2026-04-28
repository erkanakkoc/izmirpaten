'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error('Giriş başarısız.'); setLoading(false); return }
    router.push('/trainer')
    router.refresh()
  }

  return (
    <>
      {params.get('error') === 'unauthorized' && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-xl mb-4 text-center">
          Bu hesabın eğitmen erişimi yok.
        </div>
      )}
      <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 shadow-2xl space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şifre</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-orange-500 disabled:opacity-60">
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </>
  )
}

export default function TrainerLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2A4A] to-[#2d4a8a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF6B35] mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Paten İzmir</h1>
          <p className="text-blue-200 text-sm mt-1">Eğitmen Paneli</p>
        </div>
        <Suspense><LoginForm /></Suspense>
      </div>
    </div>
  )
}
