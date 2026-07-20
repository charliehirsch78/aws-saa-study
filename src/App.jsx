import { useState, useEffect } from 'react'
import { getUser, onAuthChange, isSupabaseConfigured } from './lib/supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import SessionSetup from './components/SessionSetup'
import StudySession from './components/StudySession'
import Results from './components/Results'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState('dashboard')   // dashboard | setup | session | results
  const [sessionConfig, setSessionConfig] = useState(null)
  const [sessionResults, setSessionResults] = useState(null)

  useEffect(() => {
    // Check for existing session
    if (isSupabaseConfigured()) {
      getUser().then(res => {
        setUser(res.user || null)
        setAuthLoading(false)
      })

      // Listen for auth changes
      const unsub = onAuthChange((authUser) => {
        setUser(authUser)
        if (!authUser) setView('dashboard')
      })
      return unsub
    } else {
      setAuthLoading(false)
    }
  }, [])

  // Not configured warning
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white px-4">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Supabase Not Configured</h1>
          <p className="text-slate-400 text-sm mb-4">
            Add your Supabase credentials to a <code className="bg-slate-700 px-1 rounded">.env</code> file:
          </p>
          <pre className="bg-slate-800 rounded-lg p-4 text-left text-sm text-slate-300 border border-slate-700">
{`VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key`}
          </pre>
          <p className="text-slate-500 text-xs mt-4">See README.md for setup instructions.</p>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Auth onAuth={setUser} />
  }

  if (view === 'setup') {
    return (
      <SessionSetup
        user={user}
        onStartSession={(config) => {
          setSessionConfig(config)
          setView('session')
        }}
        onBack={() => setView('dashboard')}
      />
    )
  }

  if (view === 'session' && sessionConfig) {
    return (
      <StudySession
        user={user}
        config={sessionConfig}
        onComplete={(data) => {
          setSessionResults(data)
          setView('results')
        }}
        onExit={() => setView('dashboard')}
      />
    )
  }

  if (view === 'results' && sessionResults) {
    return (
      <Results
        user={user}
        sessionData={sessionResults}
        onStudyAgain={() => setView('setup')}
        onDashboard={() => setView('dashboard')}
      />
    )
  }

  return (
    <Dashboard
      user={user}
      onStartSetup={() => setView('setup')}
      onSignOut={() => setUser(null)}
    />
  )
}
