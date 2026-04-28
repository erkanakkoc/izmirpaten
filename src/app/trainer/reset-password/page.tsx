'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Eye, EyeOff } from 'lucide-react'

export default function TrainerResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase recovery session'ını dinle
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) { setError(updateError.message); return }
    router.push('/trainer?reset=success')
  }

  const CLS = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2A4A] to-[#2d4a8a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF6B35] mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Şifre Sıfırlama</h1>
          <p className="text-blue-200 text-sm mt-1">Eğitmen Paneli</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {!ready ? (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Bağlantı doğrulanıyor...</p>
              <p className="text-xs text-gray-400 mt-2">
                E-postadaki bağlantıya tıklayarak gelmediyseniz,{' '}
                <a href="/trainer/login" className="text-[#FF6B35] font-semibold">giriş sayfasına dönün</a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-bold text-[#1B2A4A] text-lg mb-4">Yeni Şifre Belirle</h2>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yeni Şifre</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} className={`${CLS} pr-12`} placeholder="En az 6 karakter" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şifre Tekrar</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={CLS} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-orange-500 disabled:opacity-60">
                {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
