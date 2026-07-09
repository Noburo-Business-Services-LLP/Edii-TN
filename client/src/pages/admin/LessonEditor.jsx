import { useEffect, useState } from 'react';
import api from '../../lib/api';
import QuestionEditor, { emptyQuestion } from './QuestionEditor';
import TimeInput from '../../components/TimeInput';

// Edits a single lesson. Loads nothing itself — receives the lesson and a
// save handler. Local draft state is committed via "Save lesson".
export default function LessonEditor({ lesson, onSaved, onDeleted }) {
  const [draft, setDraft] = useState(lesson);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(lesson);
    setSaved(false);
  }, [lesson._id]);

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };

  async function save() {
    const { data } = await api.patch(`/lessons/${draft._id}`, {
      title: draft.title,
      type: draft.type,
      videoPath: draft.videoPath,
      duration: draft.duration,
      markers: draft.markers,
      chapters: draft.chapters,
      quiz: draft.quiz,
      content: draft.content,
    });
    setSaved(true);
    onSaved?.(data.lesson);
  }

  async function uploadVideo(file) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('video', file);
      const { data } = await api.post('/upload/video', form);
      // Read the real duration from the file for marker placement.
      const dur = await readDuration(file);
      set({ videoPath: data.videoPath, duration: Math.round(dur) || draft.duration });
    } finally {
      setUploading(false);
    }
  }

  // ---- chapters (in-video TOC) ----
  function addChapter() {
    set({ chapters: [...(draft.chapters || []), { title: 'New chapter', timestamp: 0 }] });
  }
  function updateChapter(i, patch) {
    set({ chapters: draft.chapters.map((c, x) => (x === i ? { ...c, ...patch } : c)) });
  }
  function removeChapter(i) {
    set({ chapters: draft.chapters.filter((_, x) => x !== i) });
  }

  // ---- markers ----
  function addMarker(type) {
    const marker = {
      timestamp: 0,
      type,
      pauseVideo: type === 'quiz',
      title: '',
      body: '',
      ...(type === 'quiz' ? { question: emptyQuestion() } : {}),
    };
    set({ markers: [...(draft.markers || []), marker] });
  }
  function updateMarker(i, patch) {
    const markers = draft.markers.map((m, x) => (x === i ? { ...m, ...patch } : m));
    set({ markers });
  }
  function removeMarker(i) {
    set({ markers: draft.markers.filter((_, x) => x !== i) });
  }

  // ---- quiz questions ----
  const quiz = draft.quiz || { questions: [], passingScore: 70, maxAttempts: 0, blocksProgression: true };
  function setQuiz(patch) {
    set({ quiz: { ...quiz, ...patch } });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input
          className="input text-lg font-semibold"
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        <select className="input w-40" value={draft.type} onChange={(e) => set({ type: e.target.value })}>
          <option value="video">Video</option>
          <option value="quiz">Quiz</option>
          <option value="reading">Reading</option>
        </select>
      </div>

      {/* VIDEO */}
      {draft.type === 'video' && (
        <div className="space-y-4">
          <div className="card p-4">
            <label className="label">Video file</label>
            {draft.videoPath ? (
              <p className="mb-2 text-sm text-green-700">✓ Uploaded ({draft.videoPath})</p>
            ) : (
              <p className="mb-2 text-sm text-slate-400">No video uploaded.</p>
            )}
            <input
              type="file"
              accept="video/*"
              disabled={uploading}
              onChange={(e) => e.target.files[0] && uploadVideo(e.target.files[0])}
            />
            {uploading && <p className="mt-2 text-sm text-slate-500">Uploading…</p>}
            <div className="mt-3">
              <label className="label">Duration (seconds)</label>
              <input
                className="input w-32"
                type="number"
                value={draft.duration}
                onChange={(e) => set({ duration: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* CHAPTERS (in-video TOC) */}
          <div className="card p-4">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-semibold">Chapters · table of contents</h3>
              <button className="btn-ghost btn-sm" onClick={addChapter}>
                + Chapter
              </button>
            </div>
            <p className="mb-3 text-xs text-ink-500">
              For a single long video, add chapters at timestamps. Students see them as a TOC that
              auto-highlights as the video plays and jumps when clicked.
            </p>
            {(draft.chapters || []).length === 0 && (
              <p className="text-sm text-ink-400">No chapters yet.</p>
            )}
            <div className="space-y-2">
              {(draft.chapters || [])
                .map((c, i) => ({ c, i }))
                .sort((a, b) => a.c.timestamp - b.c.timestamp)
                .map(({ c, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Chapter title"
                      value={c.title}
                      onChange={(e) => updateChapter(i, { title: e.target.value })}
                    />
                    <TimeInput
                      value={c.timestamp}
                      onChange={(secs) => updateChapter(i, { timestamp: secs })}
                    />
                    <button className="px-1 text-red-500" onClick={() => removeChapter(i)}>
                      ✕
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* MARKERS */}
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Interactive markers</h3>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => addMarker('summary')}>
                  + Summary
                </button>
                <button className="btn-ghost" onClick={() => addMarker('quiz')}>
                  + Quiz
                </button>
                <button className="btn-ghost" onClick={() => addMarker('note')}>
                  + Note
                </button>
              </div>
            </div>

            {(draft.markers || []).length === 0 && (
              <p className="text-sm text-slate-400">No markers yet. Add summaries or quizzes at timestamps.</p>
            )}

            <div className="space-y-4">
              {(draft.markers || [])
                .map((m, i) => ({ m, i }))
                .sort((a, b) => a.m.timestamp - b.m.timestamp)
                .map(({ m, i }) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                        {m.type}
                      </span>
                      <label className="text-sm text-slate-500">at</label>
                      <TimeInput
                        value={m.timestamp}
                        onChange={(secs) => updateMarker(i, { timestamp: secs })}
                      />
                      <label className="ml-auto flex items-center gap-1 text-sm text-slate-500">
                        <input
                          type="checkbox"
                          checked={m.pauseVideo}
                          onChange={(e) => updateMarker(i, { pauseVideo: e.target.checked })}
                        />
                        pause
                      </label>
                      <button className="text-red-500" onClick={() => removeMarker(i)}>
                        ✕
                      </button>
                    </div>

                    {m.type === 'quiz' ? (
                      <QuestionEditor
                        value={m.question}
                        onChange={(question) => updateMarker(i, { question })}
                      />
                    ) : (
                      <div className="space-y-2">
                        <input
                          className="input"
                          placeholder="Title"
                          value={m.title}
                          onChange={(e) => updateMarker(i, { title: e.target.value })}
                        />
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Summary / note text"
                          value={m.body}
                          onChange={(e) => updateMarker(i, { body: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* QUIZ */}
      {draft.type === 'quiz' && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-4">
            <div>
              <label className="label">Passing score (%)</label>
              <input
                className="input w-24"
                type="number"
                value={quiz.passingScore}
                onChange={(e) => setQuiz({ passingScore: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Max attempts (0 = ∞)</label>
              <input
                className="input w-24"
                type="number"
                value={quiz.maxAttempts}
                onChange={(e) => setQuiz({ maxAttempts: Number(e.target.value) })}
              />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={quiz.blocksProgression}
                onChange={(e) => setQuiz({ blocksProgression: e.target.checked })}
              />
              Blocks progression
            </label>
          </div>

          <div className="space-y-3">
            {(quiz.questions || []).map((q, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-slate-500">Question {i + 1}</span>
                  <button
                    className="text-sm text-red-500"
                    onClick={() => setQuiz({ questions: quiz.questions.filter((_, x) => x !== i) })}
                  >
                    Remove
                  </button>
                </div>
                <QuestionEditor
                  value={q}
                  onChange={(nq) =>
                    setQuiz({ questions: quiz.questions.map((x, xi) => (xi === i ? nq : x)) })
                  }
                />
              </div>
            ))}
          </div>
          <button
            className="btn-ghost mt-3"
            onClick={() => setQuiz({ questions: [...(quiz.questions || []), emptyQuestion()] })}
          >
            + Add question
          </button>
        </div>
      )}

      {/* READING */}
      {draft.type === 'reading' && (
        <div className="card p-4">
          <label className="label">Content</label>
          <textarea
            className="input"
            rows={10}
            value={draft.content}
            onChange={(e) => set({ content: e.target.value })}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save}>
          Save lesson
        </button>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        <button className="btn-ghost ml-auto text-red-600" onClick={() => onDeleted?.(draft)}>
          Delete lesson
        </button>
      </div>
    </div>
  );
}

// Read a video file's duration client-side for convenient marker placement.
function readDuration(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => resolve(v.duration);
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(file);
  });
}
