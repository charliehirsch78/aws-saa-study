import { useState, useEffect, useRef } from 'react'
import { fetchUserProgress, upsertQuestionResult } from '../lib/supabase'
import { buildSessionQueue } from '../lib/sessionLogic'
import allQuestions from '../data/questions.json'
import { X, ChevronRight, CheckCircle, XCircle, Lightbulb } from 'lucide-react'

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

export default function StudySession({ user, config, onComplete, onExit }) {
  const { count, topicFilter } = config

  const [queue, setQueue] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState(null)      // 'A'|'B'|'C'|'D' or null
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState([])           // { question, selected, correct }
  const [loading, setLoading] = useState(true)
  const startedAt = useRef(new Date().toISOString())

  useEffect(() => {
    async function init() {
      const progRes = await fetchUserProgress(user.id)
      const progress = progRes.success ? progRes.data : {}
      const q = buildSessionQueue(allQuestions, progress, count, topicFilter)
      setQueue(q)
      setLoading(false)
    }
    init()
  }, [user.id, count, topicFilter])

  const currentQ = queue[currentIdx]
  const isCorrect = selected && currentQ && selected === currentQ.answer
  const optionEntries = currentQ ? Object.entries(currentQ.options) : []

  const handleSelect = async (letter) => {
    if (revealed) return
    setSelected(letter)
    setRevealed(true)

    const correct = letter === currentQ.answer
    await upsertQuestionResult(user.id, currentQ.number, correct)
    setResults(prev => [...prev, { question: currentQ, selected: letter, correct }])
  }

  const handleNext = () => {
    if (currentIdx + 1 >= queue.length) {
      // Session complete
      const correctCount = results.filter(r => r.correct).length + (isCorrect ? 0 : 0)
      // Results already includes current question
      onComplete({
        results,
        started_at: startedAt.current,
        total_questions: queue.length,
        correct_count: results.filter(r => r.correct).length,
        topic_filter: topicFilter,
        missed_question_numbers: results.filter(r => !r.correct).map(r => r.question.number),
      })
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Building your session…
      </div>
    )
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        No questions available for this selection.
      </div>
    )
  }

  const progressPct = Math.round((currentIdx / queue.length) * 100)

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-4">
        <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Question {currentIdx + 1} of {queue.length}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          {currentQ.topic}
        </div>
      </header>

      {/* Question body */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Topic badge */}
        <div className="inline-block bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full mb-4">
          {currentQ.topic} · Q{currentQ.number}
        </div>

        {/* Question text */}
        <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed mb-8">
          {currentQ.question}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {optionEntries.map(([letter, text]) => {
            let style = 'bg-slate-800 border-slate-600 hover:border-orange-400 text-slate-200 cursor-pointer'

            if (revealed) {
              if (letter === currentQ.answer) {
                style = 'bg-green-900/40 border-green-500 text-green-200 cursor-default'
              } else if (letter === selected && letter !== currentQ.answer) {
                style = 'bg-red-900/40 border-red-500 text-red-200 cursor-default'
              } else {
                style = 'bg-slate-800/50 border-slate-700 text-slate-400 cursor-default'
              }
            } else if (selected === letter) {
              style = 'bg-orange-500/20 border-orange-500 text-white cursor-pointer'
            }

            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={revealed}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 rounded-xl border-2 transition-all ${style}`}
              >
                <span className={`font-bold text-sm mt-0.5 shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                  revealed && letter === currentQ.answer
                    ? 'bg-green-500 text-white'
                    : revealed && letter === selected && letter !== currentQ.answer
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {letter}
                </span>
                <span className="text-sm leading-relaxed">{text}</span>

                {revealed && letter === currentQ.answer && (
                  <CheckCircle className="w-5 h-5 text-green-400 ml-auto shrink-0 mt-0.5" />
                )}
                {revealed && letter === selected && letter !== currentQ.answer && (
                  <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>

        {/* Result + Explanation */}
        {revealed && (
          <div className={`rounded-xl p-5 mb-6 border ${isCorrect ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
            <div className={`flex items-center gap-2 font-semibold mb-3 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {isCorrect ? 'Correct!' : `Incorrect — Correct answer: ${currentQ.answer}`}
            </div>

            {currentQ.explanation && (
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Explanation
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {revealed && (
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {currentIdx + 1 >= queue.length ? 'View Results' : 'Next Question'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
