import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'
import { Cloud, Lock, Mail } from 'lucide-react'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const fn = mode === 'login' ? signIn : signUp
    const result = await fn(email, password)

    if (result.success) {
      if (mode === 'signup') {
        setMessage('Account created! Check your email to confirm, then log in.')
        setMode('login')
      } else {
        onAuth(result.user)
      }
    } else {
      setError(result.error || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 mb-4">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AWS SAA-C03</h1>
          <p className="text-slate-400 mt-1">Solutions Architect Study App</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">
            {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-800 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-orange-400 hover:text-orange-300 font-medium">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-orange-400 hover:text-orange-300 font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
