import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';

// Mirror of the server-side Joi policy for instant client feedback.
function passwordProblem(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw))
    return 'Password must include at least one letter and one number';
  return '';
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pwProblem = form.password ? passwordProblem(form.password) : '';
  const mismatch = form.confirmPassword && form.password !== form.confirmPassword;
  const canSubmit = form.name && form.email && !pwProblem && !mismatch && form.confirmPassword;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (pwProblem) return setError(pwProblem);
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password, form.confirmPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-ink-900">Create your account</h2>
      <p className="mt-1.5 text-sm text-ink-500">Start learning in under a minute — it's free.</p>

      {error && (
        <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="Priya Kumar" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <PasswordInput placeholder="At least 8 characters" value={form.password} onChange={set('password')} required />
          {pwProblem ? (
            <p className="mt-1.5 text-xs text-red-500">{pwProblem}</p>
          ) : (
            <p className="mt-1.5 text-xs text-ink-400">Use 8+ characters with a letter and a number.</p>
          )}
        </div>
        <div>
          <label className="label">Confirm password</label>
          <PasswordInput
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            required
          />
          {mismatch && <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>}
        </div>
        <button className="btn-primary w-full" disabled={busy || !canSubmit}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
