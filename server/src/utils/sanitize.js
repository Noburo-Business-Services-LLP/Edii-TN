// Remove answer keys before sending course/lesson content to students.
// Admins get the full object; students must never receive correctAnswers.

function stripQuestion(q) {
  if (!q) return q;
  const { correctAnswers, explanation, ...rest } = q;
  return rest;
}

export function sanitizeLessonForStudent(lessonObj) {
  const lesson = { ...lessonObj };
  if (Array.isArray(lesson.markers)) {
    lesson.markers = lesson.markers.map((m) => ({
      ...m,
      question: m.question ? stripQuestion(m.question) : m.question,
    }));
  }
  if (lesson.quiz?.questions) {
    lesson.quiz = {
      ...lesson.quiz,
      questions: lesson.quiz.questions.map(stripQuestion),
    };
  }
  return lesson;
}
