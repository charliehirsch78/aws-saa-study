import { useState, useEffect } from 'react'
import { fetchUserProgress } from '../lib/supabase'
import { getMissedCount } from '../lib/sessionLogic'
import allQuestions from '../data/questions.json'
import { ArrowLeft, PlayCircle, AlertCircle } from 'lucide-react'

const TOPIC_OPTIONS = [
  'All Topics',
  'EC2 & Auto Scaling',
  'S3 Storage',
  'RDS & Databases',
  'Lambda & Serverless',
  'VPC & Networking',
  'IAM & Security',
  'DynamoDB',
  'CloudFront & CDN',
  'Messaging & Events',
  'Containers & ECS/EKS',
  'Analytics',
  'Route 53 & DNS',
  'Storage',
  'Cost Optimization',
  'Infrastructure as Code',
  'Load Balancing',
  'Monitoring & Logging',
  'General',
]

const QUICK_COUNTS = [10, 20, 50, 100]

export default function SessionSetup({ user, onStartSession, onBack }) {
  const [count, setCount] = useState(20)
  const [customCount, setCustomCount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [topic, setTopic] = useState('All Topics')
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProgress(user.id).then(res => {
      if (res.success) setProgress(res.data)
      setLoading(false)
    })
  }, [user.id])

  const topicFilter = topic === 'All Topics' ? null : topic
  const missedCount = getMissedCount(allQuestions, progress, topicFilter)
  const availableInTopic = topicFilter
    ? allQuestions.filter(q => q.topic === topicFilter).length
    : allQuestions.length

  const finalCount = useCustom
    ? Math.min(Math.max(1, parseInt(customCount) || 1), availableInTopic)
    : Math.min(count, availableInTopic)

  const handleStart = () => {
    onStartSession({ count: finalCount, topicFilter })
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="font-semibold">Configure Session</div>
          <div className="text-xs text-slate-400">AWS SAA-C03</div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading…</div>
        ) : (
          <div className="space-y-6">
            {/* Missed questions notice */}
            {missedCount > 0 && (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl px-5 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-amber-300 font-medium text-sm">
                    {missedCount} missed question{missedCount !== 1 ? 's' : ''} will be prioritized
                  </div>
                  <div className="text-amber-400/70 text-xs mt-0.5">
                    Questions you got wrong will appear first in your session.
                  </div>
                </div>
              </div>
            )}

            {/* Topic filter */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-3">Topic Filter</label>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                {TOPIC_OPTIONS.map(t => {
                  const count = t === 'All Topics'
                    ? allQuestions.length
                    : allQuestions.filter(q => q.topic === t).length
                  return (
                    <option key={t} value={t}>
                      {t} ({count} questions)
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Question count */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Number of Questions
                <span className="text-slate-500 font-normal ml-2">({availableInTopic} available)</span>
              </label>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {QUICK_COUNTS.map(n => (
                  <button
                    key={n}
                    onClick={() => { setCount(Math.min(n, availableInTopic)); setUseCustom(false) }}
                    disabled={n > availableInTopic}
                    className={`py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      !useCustom && count === Math.min(n, availableInTopic) && n <= availableInTopic
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUseCustom(!useCustom)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    useCustom
                      ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  Custom
                </button>
                {useCustom && (
                  <input
                    type="number"
                    value={customCount}
                    onChange={e => setCustomCount(e.target.value)}
                    placeholder={`1–${availableInTopic}`}
                    min={1}
                    max={availableInTopic}
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-orange-500 text-sm"
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Summary + Start */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex justify-between text-sm text-slate-400 mb-4">
                <span>Topic</span>
                <span className="text-white font-medium">{topic}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400 mb-6">
                <span>Questions</span>
                <span className="text-white font-medium">{finalCount}</span>
              </div>

              <button
                onClick={handleStart}
                disabled={finalCount < 1}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                <PlayCircle className="w-5 h-5" />
                Start {finalCount} Question{finalCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
