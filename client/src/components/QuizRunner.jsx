import { useState } from 'react';

// Renders one or more questions, collects answers, submits, and shows feedback.
// questions: [{ _id, text, type: 'single'|'multi'|'boolean', options: [] }]
// onSubmit(answers: number[][]) => Promise<{ score, passed, feedback }>
export default function QuizRunner({ questions, onSubmit, onAnswered, submitLabel = 'Submit' }) {
  const [answers, setAnswers] = useState(questions.map(() => []));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function toggle(qi, optionIndex, multi) {
    setAnswers((prev) => {
      const next = prev.map((a) => [...a]);
      if (multi) {
        next[qi] = next[qi].includes(optionIndex)
          ? next[qi].filter((x) => x !== optionIndex)
          : [...next[qi], optionIndex];
      } else {
        next[qi] = [optionIndex];
      }
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await onSubmit(answers);
      setResult(res);
      onAnswered?.(res);
    } finally {
      setBusy(false);
    }
  }

  const answered = result !== null;

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => {
        const opts = q.type === 'boolean' ? ['True', 'False'] : q.options;
        const multi = q.type === 'multi';
        const fb = result?.feedback?.[qi];
        return (
          <div key={q._id || qi}>
            <p className="mb-2 font-medium text-slate-800">
              {questions.length > 1 && <span className="text-slate-400">{qi + 1}. </span>}
              {q.text}
              {multi && <span className="ml-2 text-xs text-slate-400">(select all)</span>}
            </p>
            <div className="space-y-2">
              {opts.map((opt, oi) => {
                const selected = answers[qi].includes(oi);
                const isCorrect = fb?.correctAnswers?.includes(oi);
                let cls = 'border-slate-300 hover:bg-slate-50';
                if (answered) {
                  if (isCorrect) cls = 'border-green-400 bg-green-50';
                  else if (selected) cls = 'border-red-400 bg-red-50';
                  else cls = 'border-slate-200';
                } else if (selected) {
                  cls = 'border-brand-500 bg-brand-50';
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={answered}
                    onClick={() => toggle(qi, oi, multi)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${cls}`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-${multi ? 'md' : 'full'} border ${
                        selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {selected && '✓'}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && fb?.explanation && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {fb.explanation}
              </p>
            )}
          </div>
        );
      })}

      {!answered ? (
        <button
          className="btn-primary"
          disabled={busy || answers.every((a) => a.length === 0)}
          onClick={submit}
        >
          {busy ? 'Checking…' : submitLabel}
        </button>
      ) : (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            result.passed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          Score: {result.score}% — {result.passed ? 'Passed ✓' : 'Keep practising'}
        </div>
      )}
    </div>
  );
}
