'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  // Exam result form
  const [subjectName, setSubjectName] = useState('')
  const [examName, setExamName] = useState('')
  const [score, setScore] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/'
      return
    }
    setUser(session.user)
    await loadProfile(session.user.id)
    await loadResults(session.user.id)
    setLoading(false)
  }

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const loadResults = async (userId: string) => {
    const { data } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    setResults(data || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleAddResult = async () => {
    if (!subjectName || !examName || !score) return
    setSaving(true)
    const { error } = await supabase.from('exam_results').insert({
      user_id: user.id,
      subject_name: subjectName,
      exam_name: examName,
      score: parseFloat(score),
      total_marks: parseFloat(totalMarks),
    })
    if (!error) {
      setSuccessMsg('✅ রেজাল্ট সেভ হয়েছে!')
      setSubjectName('')
      setExamName('')
      setScore('')
      await loadResults(user.id)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎓</div>
          <p className="text-purple-300 text-lg">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  const avgScore = results.length
    ? (results.reduce((sum, r) => sum + Number(r.percentage), 0) / results.length).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Top Navbar */}
      <nav className="bg-slate-800/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-purple-300 text-lg">Protiba AI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{profile?.full_name || 'Student'}</p>
            <p className="text-xs text-white/50">{profile?.points || 0} পয়েন্ট</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">
            {(profile?.full_name || 'S')[0].toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-white/50 hover:text-red-400 transition-colors"
          >
            লগআউট
          </button>
        </div>
      </nav>

      {/* Tab Bar */}
      <div className="bg-slate-800/50 border-b border-white/10 px-4">
        <div className="flex gap-1 max-w-4xl mx-auto">
          {[
            { id: 'dashboard', label: '🏠 Dashboard' },
            { id: 'results', label: '📊 রেজাল্ট' },
            { id: 'leaderboard', label: '🏆 Leaderboard' },
            { id: 'profile', label: '👤 প্রোফাইল' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 mt-2">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-purple-800/60 to-blue-800/60 rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold mb-1">
                স্বাগতম, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
              </h2>
              <p className="text-white/60 text-sm">আজকেও পড়াশোনা চালিয়ে যাও — সাফল্য অপেক্ষা করছে!</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'মোট পয়েন্ট', value: profile?.points || 0, icon: '⭐', color: 'from-yellow-800/50 to-orange-800/50' },
                { label: 'পরীক্ষা দিয়েছি', value: results.length, icon: '📝', color: 'from-blue-800/50 to-cyan-800/50' },
                { label: 'গড় নম্বর', value: `${avgScore}%`, icon: '📈', color: 'from-green-800/50 to-emerald-800/50' },
                { label: 'বিষয়', value: new Set(results.map(r => r.subject_name)).size, icon: '📚', color: 'from-purple-800/50 to-pink-800/50' },
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 border border-white/10`}>
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Results */}
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-white/10">
              <h3 className="font-semibold mb-4 text-white/80">📋 সাম্প্রতিক রেজাল্ট</h3>
              {results.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">এখনো কোনো রেজাল্ট নেই। রেজাল্ট ট্যাবে গিয়ে যোগ করুন!</p>
              ) : (
                <div className="space-y-2">
                  {results.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{r.subject_name}</p>
                        <p className="text-xs text-white/50">{r.exam_name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${Number(r.percentage) >= 80 ? 'text-green-400' : Number(r.percentage) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {Number(r.percentage).toFixed(1)}%
                        </p>
                        <p className="text-xs text-white/50">{r.score}/{r.total_marks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('results')}
                className="bg-purple-700/40 hover:bg-purple-700/60 border border-purple-500/30 rounded-xl p-4 text-left transition-all"
              >
                <div className="text-2xl mb-2">➕</div>
                <p className="text-sm font-medium">রেজাল্ট যোগ করুন</p>
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="bg-yellow-700/40 hover:bg-yellow-700/60 border border-yellow-500/30 rounded-xl p-4 text-left transition-all"
              >
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm font-medium">র‍্যাংকিং দেখুন</p>
              </button>
            </div>
          </div>
        )}

        {/* ===== RESULTS TAB ===== */}
        {activeTab === 'results' && (
          <div className="space-y-4 mt-2">
            {/* Add Result Form */}
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-white/10">
              <h3 className="font-semibold mb-4">➕ নতুন রেজাল্ট যোগ করুন</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">বিষয়</label>
                  <select
                    value={subjectName}
                    onChange={e => setSubjectName(e.target.value)}
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="">বিষয় বেছে নিন</option>
                    {['পদার্থবিজ্ঞান','রসায়ন','গণিত','জীববিজ্ঞান','ইংরেজি','বাংলা','ICT','সাধারণ বিজ্ঞান'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">পরীক্ষার নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: মডেল টেস্ট ১"
                    value={examName}
                    onChange={e => setExamName(e.target.value)}
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">প্রাপ্ত নম্বর</label>
                  <input
                    type="number"
                    placeholder="যেমন: 85"
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">মোট নম্বর</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={e => setTotalMarks(e.target.value)}
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
              {successMsg && <p className="text-green-400 text-sm mt-3">{successMsg}</p>}
              <button
                onClick={handleAddResult}
                disabled={saving}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? '⏳ সেভ হচ্ছে...' : '💾 রেজাল্ট সেভ করুন'}
              </button>
            </div>

            {/* All Results */}
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-white/10">
              <h3 className="font-semibold mb-4">📊 সব রেজাল্ট ({results.length}টি)</h3>
              {results.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-6">এখনো কোনো রেজাল্ট নেই</p>
              ) : (
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                          Number(r.percentage) >= 80 ? 'bg-green-700' : Number(r.percentage) >= 60 ? 'bg-yellow-700' : 'bg-red-700'
                        }`}>
                          {Number(r.percentage).toFixed(0)}%
                        </div>
                        <div>
                          <p className="text-sm font-medium">{r.subject_name}</p>
                          <p className="text-xs text-white/50">{r.exam_name} · {new Date(r.created_at).toLocaleDateString('bn-BD')}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/70">{r.score}/{r.total_marks}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== LEADERBOARD TAB ===== */}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab currentUserId={user?.id} />
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <ProfileTab profile={profile} userId={user?.id} onUpdate={() => loadProfile(user.id)} />
        )}

      </div>
    </div>
  )
}

// ===== LEADERBOARD COMPONENT =====
function LeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('global_leaderboard')
      .select('*')
      .limit(50)
    setLeaders(data || [])
    setLoading(false)
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="mt-2 space-y-4">
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-white/10">
        <h3 className="font-semibold mb-1">🏆 বাংলাদেশ র‍্যাংকিং</h3>
        <p className="text-xs text-white/50 mb-4">পয়েন্টের ভিত্তিতে সারাদেশে অবস্থান</p>
        {loading ? (
          <p className="text-center text-white/40 py-6">লোড হচ্ছে...</p>
        ) : leaders.length === 0 ? (
          <p className="text-center text-white/40 py-6">এখনো কোনো ডেটা নেই</p>
        ) : (
          <div className="space-y-2">
            {leaders.map((l, i) => (
              <div
                key={l.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  l.id === currentUserId
                    ? 'bg-purple-700/40 border border-purple-500/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="w-8 text-center text-lg">
                  {i < 3 ? medals[i] : <span className="text-sm text-white/50">#{i + 1}</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {(l.full_name || 'S')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {l.full_name}
                    {l.id === currentUserId && <span className="ml-2 text-xs text-purple-400">(আপনি)</span>}
                  </p>
                  <p className="text-xs text-white/50 truncate">{l.institute_name || 'শিক্ষার্থী'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-yellow-400">{l.points}</p>
                  <p className="text-xs text-white/40">পয়েন্ট</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== PROFILE COMPONENT =====
function ProfileTab({ profile, userId, onUpdate }: { profile: any, userId: string, onUpdate: () => void }) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [institute, setInstitute] = useState(profile?.institute_name || '')
  const [district, setDistrict] = useState(profile?.district || '')
  const [classLevel, setClassLevel] = useState(profile?.class_level || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleUpdate = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, institute_name: institute, district, class_level: classLevel, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (!error) {
      setMsg('✅ প্রোফাইল আপডেট হয়েছে!')
      onUpdate()
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  const districts = ['ঢাকা','চট্টগ্রাম','সিলেট','রাজশাহী','খুলনা','বরিশাল','ময়মনসিংহ','রংপুর','কুমিল্লা','গাজীপুর','নারায়ণগঞ্জ','টাঙ্গাইল','অন্যান্য']

  return (
    <div className="mt-2">
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-white/10 space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl font-bold">
            {(profile?.full_name || 'S')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{profile?.full_name}</h3>
            <p className="text-white/50 text-sm">{profile?.points || 0} পয়েন্ট অর্জিত</p>
          </div>
        </div>

        {[
          { label: 'পূর্ণ নাম', value: fullName, onChange: setFullName, type: 'text', placeholder: 'আপনার নাম' },
          { label: 'প্রতিষ্ঠানের নাম', value: institute, onChange: setInstitute, type: 'text', placeholder: 'স্কুল/কলেজের নাম' },
        ].map((field, i) => (
          <div key={i}>
            <label className="text-xs text-white/60 mb-1 block">{field.label}</label>
            <input
              type={field.type}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>
        ))}

        <div>
          <label className="text-xs text-white/60 mb-1 block">জেলা</label>
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
          >
            <option value="">জেলা বেছে নিন</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/60 mb-1 block">ক্লাস/লেভেল</label>
          <select
            value={classLevel}
            onChange={e => setClassLevel(e.target.value)}
            className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
          >
            <option value="">বেছে নিন</option>
            {['SSC','HSC','Admission','University','অন্যান্য'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {msg && <p className="text-green-400 text-sm">{msg}</p>}

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? '⏳ সেভ হচ্ছে...' : '💾 প্রোফাইল আপডেট করুন'}
        </button>
      </div>
    </div>
  )
}