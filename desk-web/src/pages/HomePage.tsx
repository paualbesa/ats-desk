import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/theme/ThemeContext';

function formatId(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 6);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)} ${d.slice(3)}`;
}

export default function HomePage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { colors } = useTheme();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = id.replace(/\D/g, '').slice(0, 6);
    if (clean.length < 6) return;
    const q = password ? `?password=${encodeURIComponent(password)}` : '';
    navigate(`/remote/${clean}${q}`);
  };

  return (
    <div className="card">
      <h1 style={{ margin: '0 0 8px', fontSize: '1.6rem' }}>Control remoto</h1>
      <p className="meta" style={{ marginBottom: 20 }}>
        Introduce el ID de 6 dígitos del equipo remoto.
      </p>
      <form onSubmit={onSubmit}>
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="123 456"
            value={formatId(id)}
            onChange={(e) => setId(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="off"
            inputMode="numeric"
          />
          <button className="btn" type="submit" disabled={id.length < 6}>Conectar</button>
        </div>
        <input
          className="input"
          style={{ fontSize: '1rem', letterSpacing: 'normal', fontWeight: 500 }}
          placeholder="Contraseña (opcional)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </form>
      <p className="meta" style={{ marginTop: 16 }}>
        Servidor: <strong style={{ color: colors.accent }}>rd.albesa.tech</strong> · WebSocket:{' '}
        <strong style={{ color: colors.accent }}>desk.albesa.tech</strong>
      </p>
    </div>
  );
}
