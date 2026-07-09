import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  function load() {
    api.get('/courses', { params: { all: 1 } }).then(({ data }) => setCourses(data.courses));
  }
  useEffect(load, []);

  async function createCourse(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await api.post('/courses', { title });
    setTitle('');
    setCreating(false);
    navigate(`/admin/courses/${data.course._id}`);
  }

  async function togglePublish(c) {
    await api.patch(`/courses/${c._id}`, { isPublished: !c.isPublished });
    load();
  }

  async function remove(c) {
    if (!confirm(`Delete "${c.title}"? This removes all its content.`)) return;
    await api.delete(`/courses/${c._id}`);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="text-slate-500">Manage courses, content and quizzes.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating((v) => !v)}>
          + New course
        </button>
      </div>

      {creating && (
        <form onSubmit={createCourse} className="card mb-6 flex gap-3 p-4">
          <input
            className="input"
            placeholder="Course title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <button className="btn-primary shrink-0">Create</button>
        </form>
      )}

      <div className="card divide-y divide-slate-100">
        {courses.length === 0 && <p className="p-6 text-slate-500">No courses yet.</p>}
        {courses.map((c) => (
          <div key={c._id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-slate-900">{c.title}</p>
              <p className="text-xs text-slate-500">
                {c.category} · {c.level} · {c.lessonCount} lessons
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  c.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {c.isPublished ? 'Published' : 'Draft'}
              </span>
              <button className="btn-ghost" onClick={() => togglePublish(c)}>
                {c.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <Link className="btn-ghost" to={`/admin/courses/${c._id}`}>
                Edit
              </Link>
              <button className="btn-ghost text-red-600" onClick={() => remove(c)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
