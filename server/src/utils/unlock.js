// Sequential-unlock logic. Given the ordered lesson list of a course and an
// enrollment's progress, decide which lessons are unlocked.
//
// Rule: lesson[0] is always unlocked. lesson[i] is unlocked iff lesson[i-1]
// is completed. Completed lessons stay unlocked (rewatchable). When a course
// has sequentialUnlock=false, every lesson is unlocked.

export function buildProgressMap(enrollment) {
  const map = new Map();
  for (const p of enrollment?.progress || []) {
    map.set(String(p.lesson), p);
  }
  return map;
}

// orderedLessonIds: array of lesson _id strings in course order.
export function computeUnlocked(orderedLessonIds, enrollment, sequentialUnlock = true) {
  const progressMap = buildProgressMap(enrollment);
  const unlocked = new Set();

  if (!sequentialUnlock) {
    for (const id of orderedLessonIds) unlocked.add(String(id));
    return unlocked;
  }

  let prevCompleted = true; // first lesson has no predecessor
  for (const id of orderedLessonIds) {
    const key = String(id);
    if (prevCompleted) unlocked.add(key);
    prevCompleted = !!progressMap.get(key)?.completed;
  }
  return unlocked;
}

export function isLessonUnlocked(lessonId, orderedLessonIds, enrollment, sequentialUnlock = true) {
  return computeUnlocked(orderedLessonIds, enrollment, sequentialUnlock).has(String(lessonId));
}

// Flatten a populated course (sections -> lessons) into an ordered id list.
export function orderedLessonIdsFromCourse(course) {
  const ids = [];
  for (const section of course.sections || []) {
    for (const lesson of section.lessons || []) {
      ids.push(String(lesson._id || lesson));
    }
  }
  return ids;
}
