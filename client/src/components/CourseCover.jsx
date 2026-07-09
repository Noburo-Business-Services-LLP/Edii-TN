// Deterministic gradient cover derived from the course title, so every course
// gets a distinct-but-cohesive look even without an uploaded thumbnail.
const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-fuchsia-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-sky-500 to-indigo-600',
];

export default function CourseCover({ title = '', className = '', children }) {
  const idx = [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${GRADIENTS[idx]} ${className}`}>
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, white 0, transparent 40%), radial-gradient(circle at 85% 75%, white 0, transparent 35%)',
        }}
      />
      <div className="relative flex h-full w-full items-center justify-center p-5 text-center">
        {children}
      </div>
    </div>
  );
}
