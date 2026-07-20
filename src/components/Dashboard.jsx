import { useState, useEffect } from 'react'
import { fetchUserProgress, fetchRecentSessions, signOut } from '../lib/supabase'
import { getCompletionStats, getTopicBreakdown } from '../lib/sessionLogic'
import allQuestions from '../data/questions.json'
import { BarChart2, PlayCircle, LogOut, CheckCircle, Target, Clock } from 'lucide-react'

export default function Dashboard({ user, onStartSetup, onSignOut }) {
  const [progress, setProgress] = useState({})
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [progRes, sessRes] = await Promise.all([
        fetchUserProgress(user.id),
        fetchRecentSessions(user.id, 5),
      ])
      if (progRes.success) setProgress(progRes.data)
      if (sessRes.success) setSessions(sessRes.data)
      setLoading(false)
    }
    load()
  }, [user.id])

  const stats = getCompletionStats(allQuestions, progress)
  const topicBreakdown = getTopicBreakdown(allQuestions, progress)

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  const completionPct = Math.round((stats.seen / stats.total) * 100)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-sm font-bold">A</div>
          <div>
            <div className="text-sm font-semibold">AWS SAA-C03</div>
            <div className="text-xs text-slate-400">Solutions Architect Study</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading your progress…</div>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Deck completion */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <CheckCircle className="w-4 h-4" />
                  Deck Completion
                </div>
                <div className="text-3xl font-bold mb-1">{stats.seen}<span className="text-slate-500 text-xl font-normal"> / {stats.total}</span></div>
                <div className="text-slate-400 text-sm mb-3">questions seen</div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">{completionPct}% complete</div>
              </div>

              {/* Accuracy */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Target className="w-4 h-4" />
                  Overall Accuracy
                </div>
                <div className={`text-3xl font-bold mb-1 ${stats.accuracy >= 70 ? 'text-green-400' : stats.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {stats.seen > 0 ? `${stats.accuracy}%` : '—'}
                </div>
                <div className="text-slate-400 text-sm">correct answers</div>
                <div className="text-xs text-slate-500 mt-3">
                  {stats.seen > 0 ? `Target: 70%+ to pass` : 'Start studying to see accuracy'}
                </div>
              </div>

              {/* Sessions */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Clock className="w-4 h-4" />
                  Study Sessions
                </div>
                <div className="text-3xl font-bold mb-1">{sessions.length}</div>
                <div className="text-slate-400 text-sm">sessions completed</div>
                {sessions[0] && (
                  <div className="text-xs text-slate-500 mt-3">
                    Last: {new Date(sessions[0].completed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Start session CTA */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-lg">Ready to study?</div>
                <div className="text-orange-100 text-sm mt-0.5">
                  {stats.seen === 0
                    ? '824 questions waiting. Let\'s go!'
                    : `${stats.total - stats.seen} questions unseen · missed questions will be prioritized`}
                </div>
              </div>
              <button
                onClick={onStartSetup}
                className="flex items-center gap-2 bg-white text-orange-600 font-semibold px-6 py-2.5 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap"
              >
                <PlayCircle className="w-5 h-5" />
                Start Session
              </button>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 mb-8">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700">
                <BarChart2 className="w-4 h-4 text-orange-400" />
                <h2 className="font-semibold">Topic Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left px-6 py-3 font-medium">Topic</th>
                      <th className="text-center px-4 py-3 font-medium">Questions</th>
                      <th className="text-center px-4 py-3 font-medium">Seen</th>
                      <th className="text-center px-4 py-3 font-medium">Accuracy</th>
                      <th className="px-6 py-3 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicBreakdown.map(({ topic, total, seen, accuracy }) => (
                      <tr key={topic} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-3 font-medium">{topic}</td>
                        <td className="text-center px-4 py-3 text-slate-400">{total}</td>
                        <td className="text-center px-4 py-3 text-slate-400">{seen}</td>
                        <td className="text-center px-4 py-3">
                          {accuracy === null ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <span className={accuracy >= 70 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                              {accuracy}%
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-orange-500 h-1.5 rounded-full"
                              style={{ width: `${Math.round((seen / total) * 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent sessions */}
            {sessions.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h2 className="font-semibold">Recent Sessions</h2>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {sessions.map((s) => {
                    const pct = s.total_questions > 0 ? Math.round((s.correct_count / s.total_questions) * 100) : 0
                    return (
                      <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {s.correct_count}/{s.total_questions} correct
                            {s.topic_filter && <span className="text-slate-400 ml-2">· {s.topic_filter}</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
