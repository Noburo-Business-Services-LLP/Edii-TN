import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import CourseCover from '../components/CourseCover';

export default function Catalog() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (level) params.level = level;
    const t = setTimeout(() => {
      api
        .get('/courses', { params })
        .then(({ data }) => setCourses(data.courses))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, level]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-600">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-900">Explore courses</h1>
          <p className="mt-1 text-ink-500">Structured entrepreneurship learning, one chapter at a time.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">⌕</span>
            <input
              className="input pl-9 sm:w-64"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-40" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-40 animate-pulse bg-ink-100" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-full animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card grid place-items-center py-20 text-center">
          <p className="text-lg font-medium text-ink-700">No courses found</p>
          <p className="mt-1 text-sm text-ink-400">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c._id}
              to={`/courses/${c._id}`}
              className="card group overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <CourseCover title={c.title} className="h-40">
                <span className="text-lg font-bold text-white drop-shadow-sm">{c.title}</span>
              </CourseCover>
              <div className="p-5">
                <div className="mb-2.5 flex flex-wrap gap-2">
                  <span className="chip-brand">{c.category}</span>
                  <span className="chip-muted">{c.level}</span>
                </div>
                <h3 className="font-semibold text-ink-900 group-hover:text-brand-700">{c.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{c.description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-ink-400">
                  <span>▶</span> {c.lessonCount} lessons
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
