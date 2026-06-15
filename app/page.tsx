'use client'

import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('❌ ' + error.message)
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    setMessage('')

    // Step 1: Signup
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (signupError) {
      setMessage('❌ ' + signupError.message)
      setLoading(false)
      return
    }

    // Step 2: সাথে সাথে login করো
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      setMessage('✅ Account তৈরি হয়েছে! এখন লগইন করুন।')
      setIsLogin(true)
    } else {
      window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-4xl font-bold text-white">Protiba AI</h1>
          <p className="text-purple-300 mt-2">বাংলাদেশের সেরা স্টুডেন্ট প্ল্যাটফর্ম</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">

          {/* Tab */}
          <div className="flex mb-6 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isLogin ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              লগইন
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              নতুন অ্যাকাউন্ট
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-white/80 text-sm mb-1 block">পূর্ণ নাম</label>
                <input
                  type="text"
                  placeholder="আপনার নাম লিখুন"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-white/80 text-sm mb-1 block">ইমেইল</label>
              <input
                type="email"
                placeholder="আপনার ইমেইল দিন"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-1 block">পাসওয়ার্ড</label>
              <input
                type="password"
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (isLogin ? handleLogin() : handleSignup())}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            {message && (
              <p className="text-sm text-center py-2 px-3 rounded-lg bg-white/10 text-white">
                {message}
              </p>
            )}

            <button
              onClick={isLogin ? handleLogin : handleSignup}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? '⏳ অপেক্ষা করুন...' : isLogin ? '🚀 লগইন করুন' : '✨ অ্যাকাউন্ট তৈরি করুন'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2025 Protiba AI · সবার জন্য শিক্ষা
        </p>
      </div>
    </div>
  )
}