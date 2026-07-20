/**
 * sessionLogic.js
 * Builds the question queue for a study session.
 */

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build session queue
 * @param {Array} allQuestions - full questions array
 * @param {Object} userProgress - map of question_number → { times_seen, times_correct }
 * @param {number} count - how many questions to include
 * @param {string|null} topicFilter - topic name or null for all
 * @returns {Array} ordered list of question objects
 */
export function buildSessionQueue(allQuestions, userProgress, count, topicFilter = null) {
  // Apply topic filter
  let pool = topicFilter
    ? allQuestions.filter(q => q.topic === topicFilter)
    : [...allQuestions];

  // Categorize questions
  const missed = [];       // seen but accuracy < 60%
  const unseen = [];       // never seen
  const passing = [];      // seen and accuracy >= 60%

  for (const q of pool) {
    const progress = userProgress[q.number];
    if (!progress || progress.times_seen === 0) {
      unseen.push(q);
    } else {
      const accuracy = progress.times_correct / progress.times_seen;
      if (accuracy < 0.6) {
        missed.push(q);
      } else {
        passing.push(q);
      }
    }
  }

  // Shuffle each bucket
  shuffle(missed);
  shuffle(unseen);
  shuffle(passing);

  // Build queue: missed first, then unseen, then passing
  const queue = [...missed, ...unseen, ...passing];
  return queue.slice(0, count);
}

/**
 * Get count of missed questions for display
 */
export function getMissedCount(allQuestions, userProgress, topicFilter = null) {
  const pool = topicFilter
    ? allQuestions.filter(q => q.topic === topicFilter)
    : allQuestions;

  return pool.filter(q => {
    const p = userProgress[q.number];
    if (!p || p.times_seen === 0) return false;
    return p.times_correct / p.times_seen < 0.6;
  }).length;
}

/**
 * Get completion stats
 */
export function getCompletionStats(allQuestions, userProgress) {
  let seen = 0;
  let totalCorrect = 0;
  let totalSeen = 0;

  for (const q of allQuestions) {
    const p = userProgress[q.number];
    if (p && p.times_seen > 0) {
      seen++;
      totalCorrect += p.times_correct;
      totalSeen += p.times_seen;
    }
  }

  return {
    seen,
    total: allQuestions.length,
    accuracy: totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0,
  };
}

/**
 * Get per-topic breakdown
 */
export function getTopicBreakdown(allQuestions, userProgress) {
  const topics = {};

  for (const q of allQuestions) {
    if (!topics[q.topic]) {
      topics[q.topic] = { total: 0, seen: 0, correct: 0, attempts: 0 };
    }
    const t = topics[q.topic];
    t.total++;

    const p = userProgress[q.number];
    if (p && p.times_seen > 0) {
      t.seen++;
      t.correct += p.times_correct;
      t.attempts += p.times_seen;
    }
  }

  return Object.entries(topics)
    .map(([topic, stats]) => ({
      topic,
      total: stats.total,
      seen: stats.seen,
      accuracy: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : null,
    }))
    .sort((a, b) => b.total - a.total);
}
