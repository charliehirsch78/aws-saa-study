import { createClient } from '@supabase/supabase-js'

/*
 * SUPABASE SQL SETUP — run this in your Supabase SQL editor:
 *
 * -- Enable RLS
 * create table if not exists user_question_progress (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references auth.users not null,
 *   question_number int not null,
 *   times_seen int default 0,
 *   times_correct int default 0,
 *   last_seen_at timestamptz,
 *   last_correct_at timestamptz,
 *   unique(user_id, question_number)
 * );
 * alter table user_question_progress enable row level security;
 * create policy "Users manage own progress" on user_question_progress
 *   for all using (auth.uid() = user_id);
 *
 * create table if not exists study_sessions (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references auth.users not null,
 *   started_at timestamptz default now(),
 *   completed_at timestamptz,
 *   total_questions int,
 *   correct_count int,
 *   topic_filter text,
 *   missed_question_numbers int[]
 * );
 * alter table study_sessions enable row level security;
 * create policy "Users manage own sessions" on study_sessions
 *   for all using (auth.uid() = user_id);
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const isSupabaseConfigured = () => !!supabase

// ========== AUTH ==========

export const signUp = async (email, password) => {
  if (!supabase) return { success: false, error: 'Supabase not configured', user: null }
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return { success: true, user: data.user, error: null }
  } catch (error) {
    return { success: false, error: error.message, user: null }
  }
}

export const signIn = async (email, password) => {
  if (!supabase) return { success: false, error: 'Supabase not configured', user: null }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { success: true, user: data.user, error: null }
  } catch (error) {
    return { success: false, error: error.message, user: null }
  }
}

export const signOut = async () => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getUser = async () => {
  if (!supabase) return { success: false, error: 'Supabase not configured', user: null }
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error && error.status !== 400) throw error
    return { success: true, user: data.user || null, error: null }
  } catch (error) {
    return { success: false, error: error.message, user: null }
  }
}

export const onAuthChange = (callback) => {
  if (!supabase) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event)
  })
  return () => subscription?.unsubscribe?.()
}

// ========== PROGRESS ==========

// Returns: { [question_number]: { times_seen, times_correct, last_seen_at } }
export const fetchUserProgress = async (userId) => {
  if (!supabase) return { success: false, error: 'Not configured', data: {} }
  try {
    const { data, error } = await supabase
      .from('user_question_progress')
      .select('question_number, times_seen, times_correct, last_seen_at')
      .eq('user_id', userId)
    if (error) throw error
    const map = {}
    data?.forEach(row => {
      map[row.question_number] = {
        times_seen: row.times_seen,
        times_correct: row.times_correct,
        last_seen_at: row.last_seen_at,
      }
    })
    return { success: true, data: map }
  } catch (error) {
    return { success: false, error: error.message, data: {} }
  }
}

export const upsertQuestionResult = async (userId, questionNumber, wasCorrect) => {
  if (!supabase) return { success: false, error: 'Not configured' }
  try {
    // First fetch current values
    const { data: existing } = await supabase
      .from('user_question_progress')
      .select('times_seen, times_correct')
      .eq('user_id', userId)
      .eq('question_number', questionNumber)
      .single()

    const times_seen = (existing?.times_seen || 0) + 1
    const times_correct = (existing?.times_correct || 0) + (wasCorrect ? 1 : 0)

    const { error } = await supabase
      .from('user_question_progress')
      .upsert({
        user_id: userId,
        question_number: questionNumber,
        times_seen,
        times_correct,
        last_seen_at: new Date().toISOString(),
        ...(wasCorrect ? { last_correct_at: new Date().toISOString() } : {}),
      }, { onConflict: 'user_id,question_number' })

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const saveSession = async (userId, sessionData) => {
  if (!supabase) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        started_at: sessionData.started_at,
        completed_at: new Date().toISOString(),
        total_questions: sessionData.total_questions,
        correct_count: sessionData.correct_count,
        topic_filter: sessionData.topic_filter || null,
        missed_question_numbers: sessionData.missed_question_numbers || [],
      })
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const fetchRecentSessions = async (userId, limit = 5) => {
  if (!supabase) return { success: false, error: 'Not configured', data: [] }
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}
