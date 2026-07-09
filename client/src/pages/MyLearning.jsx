import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import CourseCover from '../components/CourseCover';

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/me/enrollments')
      .then(({ data }) => setEnrollments(data.enrollments))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-3 py-20 text-ink-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        Loading…
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink-900">My Learning</h1>
      <p className="mt-1 text-ink-500">Pick up right where you left off.</p>

      {enrollments.length === 0 ? (
        <div className="card mt-8 grid place-items-center py-20 text-center">
          <p className="text-lg font-medium text-ink-700">You haven't enrolled in any courses yet</p>
          <p className="mt-1 text-sm text-ink-400">Browse the catalog to get started.</p>
          <Link to="/" className="btn-primary mt-5">
            Explore courses
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <div key={e._id} className="card overflow-hidden">
              <CourseCover title={e.course?.title || ''} className="h-32">
                <span className="font-bold text-white drop-shadow-sm">{e.course?.title}</span>
              </CourseCover>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="chip-brand">{e.course?.category}</span>
                  {e.completedAt && <span className="chip-green">Completed ✓</span>}
                </div>
                <h3 className="font-semibold text-ink-900">{e.course?.title}</h3>
                <div className="mb-4 mt-3">
                  <div className="mb-1.5 flex justify-between text-xs font-medium text-ink-500">
                    <span>{e.percentComplete}% complete</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${e.percentComplete}%` }} />
                  </div>
                </div>
                <Link to={`/learn/${e.course?._id}`} className="btn-ghost w-full">
                  {e.percentComplete > 0 ? 'Resume' : 'Start'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
