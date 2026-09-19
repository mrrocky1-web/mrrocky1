import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ restaurantName: '', city: '', ownerName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login({ email: form.email, password: form.password });
        login(res.token, res.user, res.restaurantStatus);
        navigate('/');
      } else {
        await api.signup(form);
        setNotice('Signup received! Your restaurant is pending Super Admin approval. You can log in once approved.');
        setMode('login');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-page">
      <h1>{mode === 'login' ? 'Restaurant Admin' : 'Register your restaurant'}</h1>
      <p className="sub">{mode === 'login' ? 'Sign in to manage your storefront' : 'Get listed on the platform'}</p>
      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      <form onSubmit={submit}>
        {mode === 'signup' && (
          <>
            <div className="form-field"><label>Restaurant name</label><input value={form.restaurantName} onChange={set('restaurantName')} required /></div>
            <div className="form-field"><label>City</label><input value={form.city} onChange={set('city')} /></div>
            <div className="form-field"><label>Owner name</label><input value={form.ownerName} onChange={set('ownerName')} /></div>
            <div className="form-field"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
          </>
        )}
        <div className="form-field"><label>Email</label><input type="email" value={form.email} onChange={set('email')} required /></div>
        <div className="form-field"><label>Password</label><input type="password" value={form.password} onChange={set('password')} required /></div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register restaurant'}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        {mode === 'login' ? 'New restaurant?' : 'Already registered?'}{' '}
        <button style={{ background: 'none', border: 'none', textDecoration: 'underline', padding: 0, fontWeight: 600 }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Register here' : 'Log in'}
        </button>
      </p>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
        Demo login: <b>owner@kingburger.com</b> / <b>Owner123!</b>
      </p>
    </div>
  );
}
