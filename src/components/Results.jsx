import { useEffect } from 'react'
import { saveSession } from '../lib/supabase'
import { CheckCircle, XCircle, RotateCcw, Home, Trophy, Target } from 'lucide-react'

export default function Results({ user, sessionData, onStudyAgain, onDashboard }) {
  const { results, started_at, total_questions, correct_count, topic_filter, missed_question_numbers } = sessionData
  const pct = total_questions > 0 ? Math.round((correct_count / total_questions) * 100) : 0
  const passed = pct >= 72  // AWS passing score

  useEffect(() => {
    saveSession(user.id, sessionData)
  }, [])  // eslint-disable-line

  const missedResults = results.filter(r => !r.correct)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Score card */}
        <div className={`rounded-2xl p-8 text-center mb-8 border ${passed ? 'bg-green-900/20 border-green-700' : 'bg-slate-800 border-slate-700'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 mb-4">
            {passed ? <Trophy className="w-8 h-8 text-yellow-400" /> : <Target className="w-8 h-8 text-orange-400" />}
          </div>

          <div className="text-5xl font-bold mb-2">{pct}%</div>
          <div className="text-slate-400 mb-1">{correct_count} of {total_questions} correct</div>
          {topic_filter && <div className="text-sm text-slate-500">{topic_filter}</div>}

          <div className={`mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-medium ${passed ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
            {passed ? '🎉 Passing score!' : `Target: 72% to pass`}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xl font-bold">{correct_count}</span>
            </div>
            <div className="text-sm text-slate-400">Correct</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
            <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xl font-bold">{total_questions - correct_count}</span>
            </div>
            <div className="text-sm text-slate-400">Incorrect</div>
          </div>
        </div>

        {/* Missed questions */}
        {missedResults.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 mb-8">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <h2 className="font-semibold">Missed Questions ({missedResults.length})</h2>
              <span className="text-xs text-slate-500 ml-1">— will be prioritized next session</span>
            </div>
            <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
              {missedResults.map(({ question, selected }) => (
                <div key={question.number} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                      Q{question.number} · {question.topic}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      You: {selected} · Correct: {question.answer}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{question.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onStudyAgain}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Study Again
          </button>
          <button
            onClick={onDashboard}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
