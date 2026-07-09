import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import CourseCover from '../components/CourseCover';

function fmtDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

const TYPE_ICON = { video: '▶', quiz: '✎', reading: '📄' };

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => {
      setData(data);
      // open the first section by default
      const first = data.course.sections[0]?._id;
      if (first) setOpenSections({ [first]: true });
    });
  }, [id]);

  async function onEnroll() {
    setBusy(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      navigate(`/learn/${id}`);
    } finally {
      setBusy(false);
    }
  }

  if (!data)
    return (
      <div className="flex items-center gap-3 py-20 text-ink-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        Loading…
      </div>
    );

  const { course, enrolled, percentComplete } = data;
  const totalLessons = course.sections.reduce((n, s) => n + s.lessons.length, 0);
  const totalSeconds = course.sections.reduce(
    (n, s) => n + s.lessons.reduce((m, l) => m + (l.duration || 0), 0),
    0
  );

  return (
    <div>
      <Link to="/" className="mb-5 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        ← Back to catalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="chip-brand">{course.category}</span>
            <span className="chip-muted">{course.level}</span>
          </div>
          <h1 className="text-3xl font-bold text-ink-900">{course.title}</h1>
          <p className="mt-3 leading-relaxed text-ink-600">{course.description}</p>

          <div className="mt-5 flex flex-wrap gap-6 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">📚 {course.sections.length} sections</span>
            <span className="flex items-center gap-1.5">▶ {totalLessons} lessons</span>
            {totalSeconds > 0 && <span className="flex items-center gap-1.5">⏱ {fmtDuration(totalSeconds)}</span>}
          </div>

          <h2 className="mb-3 mt-9 text-lg font-semibold text-ink-900">Course content</h2>
          <div className="space-y-2.5">
            {course.sections.map((s, si) => {
              const open = openSections[s._id];
              return (
                <div key={s._id} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenSections((o) => ({ ...o, [s._id]: !o[s._id] }))}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-ink-50"
                  >
                    <span className="font-medium text-ink-900">
                      <span className="mr-2 text-ink-400">{String(si + 1).padStart(2, '0')}</span>
                      {s.title}
                    </span>
                    <span className="flex items-center gap-3 text-sm text-ink-400">
                      {s.lessons.length} lessons
                      <span className={`transition ${open ? 'rotate-180' : ''}`}>⌄</span>
                    </span>
                  </button>
                  {open && (
                    <ul className="divide-y divide-ink-100 border-t border-ink-100">
                      {s.lessons.map((l) => (
                        <li key={l._id} className="flex items-center justify-between px-5 py-3 text-sm">
                          <span className="flex items-center gap-3 text-ink-600">
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-ink-100 text-xs text-ink-500">
                              {TYPE_ICON[l.type] || '•'}
                            </span>
                            {l.title}
                          </span>
                          <span className="text-ink-400">
                            {l.type === 'video' ? fmtDuration(l.duration) : l.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky enroll card */}
        <aside className="lg:col-span-1">
          <div className="card sticky top-24 overflow-hidden">
            <CourseCover title={course.title} className="h-36">
              <span className="font-bold text-white drop-shadow-sm">{course.title}</span>
            </CourseCover>
            <div className="p-5">
              {enrolled ? (
                <>
                  <div className="mb-4">
                    <div className="mb-1.5 flex justify-between text-xs font-medium text-ink-500">
                      <span>Your progress</span>
                      <span className="text-ink-800">{percentComplete}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percentComplete}%` }} />
                    </div>
                  </div>
                  <Link to={`/learn/${id}`} className="btn-primary w-full">
                    {percentComplete > 0 ? 'Continue learning' : 'Start learning'}
                  </Link>
                </>
              ) : (
                <>
                  <p className="mb-1 text-2xl font-bold text-ink-900">Free</p>
                  <p className="mb-4 text-sm text-ink-500">Full lifetime access.</p>
                  <button className="btn-primary w-full" onClick={onEnroll} disabled={busy}>
                    {busy ? 'Enrolling…' : 'Enroll now'}
                  </button>
                </>
              )}
              {user?.role === 'admin' && (
                <Link to={`/admin/courses/${id}`} className="btn-ghost mt-2.5 w-full">
                  Edit course
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
