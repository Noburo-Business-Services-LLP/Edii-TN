// Shared split-screen layout for Login / Register.
// Left: brand panel with gradient + value props. Right: the form.
export default function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 60%, white 0, transparent 40%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur">
              E
            </span>
            <span className="text-lg font-semibold">EDII-TN Learning</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Build the skills to build a business.
            </h1>
            <p className="mt-4 text-brand-100">
              Structured entrepreneurship courses from the Entrepreneurship Development &
              Innovation Institute, Tamil Nadu — learn at your pace, one chapter at a time.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-brand-50">
              {[
                'Guided, chapter-by-chapter learning',
                'Interactive quizzes inside every lesson',
                'Track your progress and pick up where you left off',
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-brand-200">
            © {new Date().getFullYear()} EDII-TN. All rights reserved.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              E
            </span>
            <span className="text-lg font-semibold text-ink-900">EDII-TN Learning</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
