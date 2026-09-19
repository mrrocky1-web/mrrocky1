import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      login(res.token, res.user);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-page">
      <h1>SUPER ADMIN</h1>
      <p className="sub">Master control panel — highest privilege access</p>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="form-field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Verifying…' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
        Demo login: <span className="mono">super@platform.com</span> / <span className="mono">SuperAdmin123!</span>
      </p>
    </div>
  );
}
