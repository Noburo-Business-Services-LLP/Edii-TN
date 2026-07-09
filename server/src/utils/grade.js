// Grade a set of answers against questions.
// questions: [{ correctAnswers: [Number], points }]
// answers:   [[Number]] selected option indexes, aligned by index to questions
// Returns { score (0-100), earned, total }.

function arraysEqualAsSets(a = [], b = []) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

export function gradeAnswers(questions, answers) {
  let earned = 0;
  let total = 0;
  questions.forEach((q, i) => {
    const points = q.points || 1;
    total += points;
    if (arraysEqualAsSets(q.correctAnswers || [], answers[i] || [])) {
      earned += points;
    }
  });
  const score = total === 0 ? 0 : Math.round((earned / total) * 100);
  return { score, earned, total };
}
