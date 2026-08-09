import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="desk-shell" style={{ maxWidth: 480, margin: '40px auto', '--sidebar-bg': '#FF6B00' } as React.CSSProperties}>
      <aside className="desk-sidebar" style={{ width: '100%' }}>
        <div className="desk-brand">
          <img src="/logo.png" alt="" />
          <h1>ATS Desk</h1>
        </div>
        <div className="login-wrap">
          <p className="meta" style={{ color: 'rgba(255,255,255,0.8)' }}>Cuenta Albesa Tech</p>
          <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="desk-input desk-input-pass" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="desk-input desk-input-pass" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error ? <p className="error">{error}</p> : null}
            <button className="desk-btn" type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
          </form>
          <p style={{ marginTop: 16 }}>
            <Link to="/" style={{ color: '#fff', fontWeight: 600 }}>Volver</Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
