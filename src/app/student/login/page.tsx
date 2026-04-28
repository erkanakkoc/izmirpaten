'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const MAX_ATTEMPTS = 3

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { a, b, answer: a + b }
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [captcha, setCaptcha] = useState(generateCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  const needsCaptcha = attempts >= MAX_ATTEMPTS

  const verifyCaptcha = () => {
    if (parseInt(captchaInput) === captcha.answer) {
      setCaptchaVerified(true)
      setError('')
    } else {
      setError('Doğrulama yanıtı yanlış.')
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (needsCaptcha && !captchaVerified) {
      setError('Lütfen önce doğrulama sorusunu cevaplayın.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setCaptchaVerified(false)
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`E-posta veya şifre hatalı. ${newAttempts} başarısız deneme — lütfen aşağıdaki doğrulamayı tamamlayın.`)
      } else {
        setError(`E-posta veya şifre hatalı. (${newAttempts}/${MAX_ATTEMPTS} deneme)`)
      }
      setLoading(false)
      return
    }
    router.push('/student')
    router.refresh()
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${siteUrl}/student/reset-password`,
    })
    setResetLoading(false)
    if (resetError) { toast.error('Sıfırlama maili gönderilemedi: ' + resetError.message); return }
    setResetSent(true)
  }

  const CLS = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm'

  return (
    <>
      {params.get('error') === 'notfound' && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-xl mb-4 text-center">
          Öğrenci hesabı bulunamadı. Başvurunuzun onaylanmasını bekleyin.
        </div>
      )}

      {!showForgot ? (
        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 shadow-2xl space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={CLS}
              placeholder="Başvuruda kullandığın e-posta" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şifre</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                className={`${CLS} pr-12`} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Math CAPTCHA */}
          {needsCaptcha && !captchaVerified && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-700 mb-3">Devam etmek için soruyu çözün:</p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#1B2A4A]">{captcha.a} + {captcha.b} = ?</span>
                <input type="number" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" placeholder="?" />
                <button type="button" onClick={verifyCaptcha}
                  className="px-3 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">
                  Doğrula
                </button>
                <button type="button" onClick={() => { setCaptcha(generateCaptcha()); setCaptchaInput('') }}
                  className="p-2 text-gray-400 hover:text-gray-600">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          )}
          {needsCaptcha && captchaVerified && (
            <div className="text-xs text-green-600 font-semibold bg-green-50 border border-green-100 px-3 py-2 rounded-xl">✅ Doğrulama tamamlandı</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-orange-500 disabled:opacity-60">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
          <button type="button" onClick={() => { setShowForgot(true); setResetEmail(email) }}
            className="w-full text-center text-sm text-gray-400 hover:text-[#FF6B35] transition-colors">
            Şifremi unuttum
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {!resetSent ? (
            <>
              <h2 className="font-bold text-[#1B2A4A] text-lg mb-2">Şifre Sıfırlama</h2>
              <p className="text-sm text-gray-500 mb-5">Kayıtlı e-posta adresinize sıfırlama bağlantısı göndereceğiz.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta</label>
                  <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} className={CLS} />
                </div>
                <button type="submit" disabled={resetLoading}
                  className="w-full py-3 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-orange-500 disabled:opacity-60">
                  {resetLoading ? 'Gönderiliyor...' : 'Sıfırlama Maili Gönder'}
                </button>
                <button type="button" onClick={() => setShowForgot(false)}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600">
                  ← Girişe Dön
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="font-bold text-[#1B2A4A] text-lg mb-2">Mail Gönderildi!</h3>
              <p className="text-sm text-gray-500 mb-5">{resetEmail} adresine sıfırlama bağlantısı gönderildi.</p>
              <button onClick={() => { setShowForgot(false); setResetSent(false) }}
                className="text-sm text-[#FF6B35] font-semibold hover:underline">
                ← Girişe Dön
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function StudentLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2A4A] to-[#FF6B35] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Paten İzmir</h1>
          <p className="text-white/70 text-sm mt-1">Öğrenci Paneli</p>
        </div>
        <Suspense><LoginForm /></Suspense>
      </div>
    </div>
  )
}
