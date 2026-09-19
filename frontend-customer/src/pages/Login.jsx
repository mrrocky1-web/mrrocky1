import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/account';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.signup(form);
      login(res.token, res.user);
      navigate(next);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-page">
      <h1>{mode === 'login' ? 'Log in' : 'Create account'}</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit}>
        {mode === 'signup' && (
          <div className="form-field">
            <label>Name</label>
            <input value={form.name} onChange={set('name')} required />
          </div>
        )}
        <div className="form-field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} required />
        </div>
        {mode === 'signup' && (
          <div className="form-field">
            <label>Phone</label>
            <input value={form.phone} onChange={set('phone')} />
          </div>
        )}
        <div className="form-field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} required />
        </div>
        <button className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        {mode === 'login' ? "New here?" : 'Already have an account?'}{' '}
        <button className="btn" style={{ border: 'none', padding: 0, textDecoration: 'underline', fontSize: 14 }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </button>
      </p>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
        Demo login: <b>customer@example.com</b> / <b>Customer123!</b>
      </p>
      <p style={{ marginTop: 8, fontSize: 13 }}>
        <Link to="/">← Back to home</Link>
      </p>
    </div>
  );
}
