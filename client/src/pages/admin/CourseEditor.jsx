import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import LessonEditor from './LessonEditor';

export default function CourseEditor() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  async function load() {
    const { data } = await api.get(`/courses/${id}`);
    setCourse(data.course);
    return data.course;
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!course) return <p className="text-slate-500">Loading…</p>;

  const allLessons = course.sections.flatMap((s) => s.lessons);
  const selectedLesson = allLessons.find((l) => l._id === selectedLessonId);

  // ---- course meta ----
  async function saveMeta(patch) {
    const { data } = await api.patch(`/courses/${id}`, patch);
    setCourse((c) => ({ ...c, ...data.course }));
  }

  // ---- sections ----
  async function addSection() {
    await api.post(`/courses/${id}/sections`, { title: 'New section' });
    load();
  }
  async function renameSection(sectionId, title) {
    await api.patch(`/sections/${sectionId}`, { title });
    setCourse((c) => ({
      ...c,
      sections: c.sections.map((s) => (s._id === sectionId ? { ...s, title } : s)),
    }));
  }
  async function deleteSection(sectionId) {
    if (!confirm('Delete this section and its lessons?')) return;
    await api.delete(`/sections/${sectionId}`);
    load();
  }

  // ---- lessons ----
  async function addLesson(sectionId) {
    const { data } = await api.post(`/sections/${sectionId}/lessons`, {
      title: 'New lesson',
      type: 'video',
    });
    await load();
    setSelectedLessonId(data.lesson._id);
  }
  async function deleteLesson(lesson) {
    if (!confirm('Delete this lesson?')) return;
    await api.delete(`/lessons/${lesson._id}`);
    setSelectedLessonId(null);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/admin" className="text-sm text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            course.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {course.isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Course settings */}
      <div className="card mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input
              className="input"
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
              onBlur={(e) => saveMeta({ title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={course.description}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
              onBlur={(e) => saveMeta({ description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <input
              className="input"
              value={course.category}
              onChange={(e) => setCourse({ ...course, category: e.target.value })}
              onBlur={(e) => saveMeta({ category: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Level</label>
            <select
              className="input"
              value={course.level}
              onChange={(e) => saveMeta({ level: e.target.value })}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={course.sequentialUnlock}
              onChange={(e) => saveMeta({ sequentialUnlock: e.target.checked })}
            />
            Sequential unlock (lessons unlock one by one)
          </label>
          <button className="btn-primary ml-auto" onClick={() => saveMeta({ isPublished: !course.isPublished })}>
            {course.isPublished ? 'Unpublish' : 'Publish course'}
          </button>
        </div>
      </div>

      {/* Two-pane: TOC + lesson editor */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card h-fit p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Table of contents</h3>
            <button className="text-sm text-brand-600" onClick={addSection}>
              + Section
            </button>
          </div>
          {course.sections.length === 0 && <p className="text-sm text-slate-400">No sections yet.</p>}
          <div className="space-y-4">
            {course.sections.map((s) => (
              <div key={s._id}>
                <div className="mb-1 flex items-center gap-1">
                  <input
                    className="input text-sm font-medium"
                    value={s.title}
                    onChange={(e) =>
                      setCourse({
                        ...course,
                        sections: course.sections.map((x) =>
                          x._id === s._id ? { ...x, title: e.target.value } : x
                        ),
                      })
                    }
                    onBlur={(e) => renameSection(s._id, e.target.value)}
                  />
                  <button className="px-1 text-red-500" onClick={() => deleteSection(s._id)}>
                    ✕
                  </button>
                </div>
                <ul className="ml-1 space-y-1">
                  {s.lessons.map((l) => (
                    <li key={l._id}>
                      <button
                        onClick={() => setSelectedLessonId(l._id)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                          selectedLessonId === l._id
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-slate-400">
                          {l.type === 'quiz' ? '✎' : l.type === 'reading' ? '📄' : '▶'}
                        </span>
                        {l.title}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="ml-2 mt-1 text-xs text-brand-600"
                  onClick={() => addLesson(s._id)}
                >
                  + Add lesson
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="card p-5">
          {selectedLesson ? (
            <LessonEditor
              key={selectedLesson._id}
              lesson={selectedLesson}
              onSaved={() => load()}
              onDeleted={deleteLesson}
            />
          ) : (
            <div className="grid h-40 place-items-center text-slate-400">
              Select a lesson to edit, or add one.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
