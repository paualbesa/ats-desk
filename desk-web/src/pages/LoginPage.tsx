import { FormEvent, useState } from 'react';
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
    <div className="card" style={{ maxWidth: 420 }}>
      <h1 style={{ margin: '0 0 8px' }}>Iniciar sesión</h1>
      <p className="meta">Cuenta Albesa Tech (Supabase)</p>
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <input
          className="input"
          style={{ width: '100%', marginBottom: 10, fontSize: '1rem', letterSpacing: 'normal' }}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          style={{ width: '100%', marginBottom: 10, fontSize: '1rem', letterSpacing: 'normal' }}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="meta" style={{ marginTop: 16 }}>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
