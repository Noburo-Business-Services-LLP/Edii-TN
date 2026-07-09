import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import QuizRunner from './QuizRunner';

// Video player with interactive markers + chapter support.
//  - summary/note markers surface a card (and are lifted to the parent panel)
//  - quiz markers pause the video and block resuming until answered
//  - the user cannot seek past an unanswered blocking quiz marker
//  - reports currentTime to the parent (for chapter highlighting) and exposes
//    an imperative seekTo(seconds) so the chapter TOC can jump the video.
const VideoPlayer = forwardRef(function VideoPlayer(
  { lesson, src, onProgress, onEnded, onSummary, onAttempt, onTime },
  ref
) {
  const videoRef = useRef(null);
  const answeredRef = useRef(new Set());
  const shownSummaryRef = useRef(new Set());
  const lastReportRef = useRef(0);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [toast, setToast] = useState(null);

  const markers = lesson.markers || [];
  const blockingQuizzes = markers
    .filter((m) => m.type === 'quiz' && m.pauseVideo)
    .sort((a, b) => a.timestamp - b.timestamp);

  useImperativeHandle(ref, () => ({
    seekTo(sec) {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = sec;
      v.play().catch(() => {});
    },
  }));

  // Reset per-lesson state when the lesson changes.
  useEffect(() => {
    answeredRef.current = new Set();
    shownSummaryRef.current = new Set();
    lastReportRef.current = 0;
    setActiveQuiz(null);
    setQuizAnswered(false);
    setToast(null);
  }, [lesson._id]);

  function firstUnansweredGate(t) {
    return blockingQuizzes.find((m) => t >= m.timestamp && !answeredRef.current.has(String(m._id)));
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    onTime?.(t);

    if (!activeQuiz) {
      const gate = firstUnansweredGate(t);
      if (gate) {
        video.pause();
        setQuizAnswered(false);
        setActiveQuiz(gate);
        return;
      }
    }

    markers
      .filter((m) => m.type !== 'quiz')
      .forEach((m) => {
        const key = String(m._id);
        if (t >= m.timestamp && !shownSummaryRef.current.has(key)) {
          shownSummaryRef.current.add(key);
          onSummary?.(m);
          if (m.pauseVideo) video.pause();
          setToast({ title: m.title || 'Summary', body: m.body });
          setTimeout(() => setToast((cur) => (cur && cur.body === m.body ? null : cur)), 6000);
        }
      });

    if (t - lastReportRef.current >= 5) {
      lastReportRef.current = t;
      onProgress?.(Math.floor(t), false);
    }
  }

  function handleSeeking() {
    const video = videoRef.current;
    if (!video) return;
    const gate = blockingQuizzes.find((m) => !answeredRef.current.has(String(m._id)));
    if (gate && video.currentTime > gate.timestamp + 0.5) {
      video.currentTime = gate.timestamp;
    }
  }

  function handleEnded() {
    const video = videoRef.current;
    onProgress?.(Math.floor(video?.duration || lesson.duration || 0), true);
    onEnded?.();
  }

  async function submitMarkerQuiz(answers) {
    const res = await onAttempt(activeQuiz._id, answers);
    answeredRef.current.add(String(activeQuiz._id));
    return res;
  }

  function resumeAfterQuiz() {
    setActiveQuiz(null);
    setQuizAnswered(false);
    videoRef.current?.play().catch(() => {});
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black shadow-card">
      <video
        ref={videoRef}
        src={src}
        controls
        className="aspect-video w-full"
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
      />

      {toast && !activeQuiz && (
        <div className="absolute bottom-16 left-4 right-4 animate-fade-in rounded-xl border border-white/10 bg-white/95 p-4 shadow-pop backdrop-blur sm:max-w-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">💡 {toast.title}</p>
          <p className="mt-1 text-sm text-ink-600">{toast.body}</p>
        </div>
      )}

      {activeQuiz && (
        <div className="absolute inset-0 grid place-items-center bg-ink-900/80 p-4 backdrop-blur-sm">
          <div className="max-h-full w-full max-w-lg animate-fade-in overflow-auto rounded-2xl bg-white p-6 shadow-pop">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              ✦ Checkpoint
            </p>
            <QuizRunner
              questions={[activeQuiz.question]}
              onSubmit={submitMarkerQuiz}
              onAnswered={() => setQuizAnswered(true)}
              submitLabel="Check answer"
            />
            <button className="btn-primary mt-5 w-full" onClick={resumeAfterQuiz} disabled={!quizAnswered}>
              {quizAnswered ? 'Continue video →' : 'Answer to continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;
