import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { streamUrl } from '../lib/api';
import VideoPlayer from '../components/VideoPlayer';
import QuizRunner from '../components/QuizRunner';

function fmtTime(sec = 0) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export default function LessonPlayer() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [activeChapter, setActiveChapter] = useState(-1);
  const enrollmentIdRef = useRef(null);
  const playerRef = useRef(null);

  async function load(selectFirstIncomplete = false) {
    const { data } = await api.get(`/courses/${courseId}`);
    setData(data);
    enrollmentIdRef.current = data.enrollmentId;
    if (selectFirstIncomplete || !currentId) {
      const flat = flatten(data.course);
      const next = flat.find((l) => l.unlocked && !l.completed) || flat[0];
      if (next) setCurrentId(next._id);
    }
    return data;
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const flat = useMemo(() => (data ? flatten(data.course) : []), [data]);
  const current = flat.find((l) => l._id === currentId);
  const chapters = useMemo(
    () => [...(current?.chapters || [])].sort((a, b) => a.timestamp - b.timestamp),
    [current]
  );

  useEffect(() => {
    setSummaries([]);
    setActiveChapter(-1);
  }, [currentId]);

  // Auto-highlight the chapter matching the current playback time.
  function handleTime(t) {
    let idx = -1;
    for (let i = 0; i < chapters.length; i++) {
      if (t >= chapters[i].timestamp) idx = i;
      else break;
    }
    setActiveChapter((prev) => (prev === idx ? prev : idx));
  }

  async function reportProgress(watchedSeconds, completed) {
    if (!enrollmentIdRef.current) return;
    await api.patch(`/enrollments/${enrollmentIdRef.current}/progress`, {
      lessonId: currentId,
      watchedSeconds,
      completed,
    });
    if (completed) await load();
  }

  async function submitMarkerAttempt(markerId, answers) {
    const { data } = await api.post(`/lessons/${currentId}/attempt`, { markerId, answers });
    return { score: data.attempt.score, passed: data.attempt.passed, feedback: data.feedback };
  }

  async function submitFullQuiz(answers) {
    const { data } = await api.post(`/lessons/${currentId}/attempt`, { answers });
    const res = { score: data.attempt.score, passed: data.attempt.passed, feedback: data.feedback };
    if (res.passed) await reportProgress(0, true);
    return res;
  }

  function goNext() {
    const idx = flat.findIndex((l) => l._id === currentId);
    const next = flat[idx + 1];
    if (next && next.unlocked) setCurrentId(next._id);
    else load();
  }

  if (!data)
    return (
      <div className="flex items-center gap-3 py-20 text-ink-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        Loading…
      </div>
    );

  if (!data.enrolled)
    return (
      <div className="card grid place-items-center py-16 text-center">
        <p className="text-lg font-medium text-ink-700">You're not enrolled in this course</p>
        <Link to={`/courses/${courseId}`} className="btn-primary mt-4">
          Go to course page
        </Link>
      </div>
    );

  return (
    <div>
      <Link to="/my-learning" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        ← My Learning
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div>
          <div className="mb-4">
            <p className="text-xs font-medium text-brand-600">{data.course.title}</p>
            <h1 className="mt-0.5 text-xl font-bold text-ink-900">{current?.title}</h1>
            {chapters[activeChapter] && (
              <p className="mt-1 text-sm text-ink-500">
                Now playing · <span className="font-medium text-ink-700">{chapters[activeChapter].title}</span>
              </p>
            )}
          </div>

          {current?.type === 'video' &&
            (current.videoPath ? (
              <VideoPlayer
                ref={playerRef}
                key={current._id}
                lesson={current}
                src={streamUrl(current._id)}
                onProgress={reportProgress}
                onEnded={goNext}
                onSummary={(m) => setSummaries((s) => [...s, m])}
                onAttempt={submitMarkerAttempt}
                onTime={handleTime}
              />
            ) : (
              <div className="card grid aspect-video place-items-center text-ink-400">
                No video uploaded for this lesson yet.
              </div>
            ))}

          {current?.type === 'reading' && (
            <div className="card p-7">
              <div className="whitespace-pre-wrap leading-relaxed text-ink-700">
                {current.content || 'No content yet.'}
              </div>
              <button className="btn-primary mt-6" onClick={() => reportProgress(0, true)}>
                Mark complete & continue
              </button>
            </div>
          )}

          {current?.type === 'quiz' && (
            <div className="card p-7">
              <h2 className="mb-5 text-lg font-semibold text-ink-900">Quiz</h2>
              {current.quiz?.questions?.length ? (
                <QuizRunner key={current._id} questions={current.quiz.questions} onSubmit={submitFullQuiz} submitLabel="Submit quiz" />
              ) : (
                <p className="text-ink-400">No questions yet.</p>
              )}
            </div>
          )}

          {summaries.length > 0 && (
            <div className="card mt-6 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink-900">
                💡 Key takeaways
              </h3>
              <ul className="space-y-3.5">
                {summaries.map((s, i) => (
                  <li key={i} className="rounded-xl border border-ink-100 bg-ink-50/60 p-3.5">
                    <p className="text-sm font-medium text-ink-800">{s.title}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{s.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* TOC sidebar */}
        <aside>
          <div className="card sticky top-24 overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <div className="mb-1.5 flex justify-between text-xs font-medium text-ink-500">
                <span>Course progress</span>
                <span className="text-ink-800">{data.percentComplete}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${data.percentComplete}%` }} />
              </div>
            </div>

            <div className="max-h-[68vh] overflow-auto py-1">
              {data.course.sections.map((s) => (
                <div key={s._id} className="py-1">
                  <p className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                    {s.title}
                  </p>
                  <ul>
                    {s.lessons.map((l) => {
                      const active = l._id === currentId;
                      const locked = !l.unlocked;
                      const lessonChapters = active
                        ? [...(l.chapters || [])].sort((a, b) => a.timestamp - b.timestamp)
                        : [];
                      return (
                        <li key={l._id}>
                          <button
                            disabled={locked}
                            onClick={() => !locked && setCurrentId(l._id)}
                            className={`flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-sm transition ${
                              active
                                ? 'bg-brand-50/70 font-medium text-brand-700'
                                : 'text-ink-700 hover:bg-ink-50'
                            } ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
                            title={locked ? 'Complete the previous lesson to unlock' : ''}
                          >
                            <StatusIcon lesson={l} locked={locked} />
                            <span className="flex-1">{l.title}</span>
                          </button>

                          {/* Chapter list for the active video lesson */}
                          {active && lessonChapters.length > 0 && (
                            <ul className="mb-1 ml-[42px] mr-3 space-y-0.5 border-l border-ink-100 pl-2">
                              {lessonChapters.map((ch, ci) => (
                                <li key={ci}>
                                  <button
                                    onClick={() => playerRef.current?.seekTo(ch.timestamp)}
                                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition ${
                                      ci === activeChapter
                                        ? 'bg-brand-100/70 font-medium text-brand-800'
                                        : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className={`h-1.5 w-1.5 rounded-full ${ci === activeChapter ? 'bg-brand-600' : 'bg-ink-300'}`} />
                                      {ch.title}
                                    </span>
                                    <span className="tabular-nums text-[11px] text-ink-400">{fmtTime(ch.timestamp)}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusIcon({ lesson, locked }) {
  if (lesson.completed)
    return <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] text-emerald-600">✓</span>;
  if (locked)
    return <span className="grid h-5 w-5 shrink-0 place-items-center text-ink-400">🔒</span>;
  const icon = lesson.type === 'quiz' ? '✎' : lesson.type === 'reading' ? '📄' : '▶';
  return <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] text-brand-600">{icon}</span>;
}

function flatten(course) {
  const out = [];
  for (const s of course.sections || []) for (const l of s.lessons || []) out.push(l);
  return out;
}
