// Reusable editor for a single question object.
// value: { text, type, options[], correctAnswers[], explanation, points }
export default function QuestionEditor({ value, onChange }) {
  const q = value;
  const set = (patch) => onChange({ ...q, ...patch });
  const isBool = q.type === 'boolean';
  const options = isBool ? ['True', 'False'] : q.options;

  function setType(type) {
    if (type === 'boolean') set({ type, options: ['True', 'False'], correctAnswers: [0] });
    else set({ type, correctAnswers: [] });
  }

  function setOption(i, text) {
    const opts = [...q.options];
    opts[i] = text;
    set({ options: opts });
  }
  function addOption() {
    set({ options: [...(q.options || []), ''] });
  }
  function removeOption(i) {
    const opts = q.options.filter((_, x) => x !== i);
    const correct = q.correctAnswers.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x));
    set({ options: opts, correctAnswers: correct });
  }
  function toggleCorrect(i) {
    if (q.type === 'multi') {
      const has = q.correctAnswers.includes(i);
      set({ correctAnswers: has ? q.correctAnswers.filter((x) => x !== i) : [...q.correctAnswers, i] });
    } else {
      set({ correctAnswers: [i] });
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <div>
        <label className="label">Question</label>
        <input className="input" value={q.text} onChange={(e) => set({ text: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={q.type} onChange={(e) => setType(e.target.value)}>
            <option value="single">Single choice</option>
            <option value="multi">Multiple choice</option>
            <option value="boolean">True / False</option>
          </select>
        </div>
        <div>
          <label className="label">Points</label>
          <input
            className="input w-24"
            type="number"
            min={1}
            value={q.points}
            onChange={(e) => set({ points: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="label">Options {q.type === 'multi' && '(tick all correct)'}</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={q.type === 'multi' ? 'checkbox' : 'radio'}
                checked={q.correctAnswers.includes(i)}
                onChange={() => toggleCorrect(i)}
                title="Mark correct"
              />
              <input
                className="input"
                value={opt}
                disabled={isBool}
                onChange={(e) => setOption(i, e.target.value)}
              />
              {!isBool && q.options.length > 2 && (
                <button type="button" className="text-red-500" onClick={() => removeOption(i)}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {!isBool && (
          <button type="button" className="mt-2 text-sm text-brand-600" onClick={addOption}>
            + Add option
          </button>
        )}
      </div>

      <div>
        <label className="label">Explanation (shown after answering)</label>
        <input
          className="input"
          value={q.explanation}
          onChange={(e) => set({ explanation: e.target.value })}
        />
      </div>
    </div>
  );
}

export const emptyQuestion = () => ({
  text: '',
  type: 'single',
  options: ['', ''],
  correctAnswers: [],
  explanation: '',
  points: 1,
});
