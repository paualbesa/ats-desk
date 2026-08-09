import React, { FormEvent, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useTheme } from '@/theme/ThemeContext';

function formatId(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 6);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)} ${d.slice(3)}`;
}

export default function DesktopLayout() {
  const { colors, mode } = useTheme();
  const { user } = useAuth();
  const { online, checking } = useServerStatus();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const clean = id.replace(/\D/g, '').slice(0, 6);

  const onConnect = (e: FormEvent) => {
    e.preventDefault();
    if (clean.length < 6) return;
    const q = password ? `?password=${encodeURIComponent(password)}` : '';
    navigate(`/remote/${clean}${q}`);
  };

  const sidebarStyle = {
    '--sidebar-bg': mode === 'albesa' ? colors.bg : '#FF6B00',
    '--sidebar-text': mode === 'albesa' ? colors.text : '#FFFFFF',
    '--sidebar-accent': mode === 'albesa' ? colors.accent : '#FFFFFF',
    '--sidebar-muted': mode === 'albesa' ? colors.textSecondary : 'rgba(255,255,255,0.75)',
    '--btn-on-accent': '#121214',
  } as React.CSSProperties;

  const shellStyle = {
    '--bg': colors.bg,
    '--text': colors.text,
    '--text-secondary': colors.textSecondary,
    '--border': colors.border,
    '--accent': colors.accent,
    '--panel-bg': colors.bg,
    '--card-bg': colors.bgCard,
    ...sidebarStyle,
  } as React.CSSProperties;

  return (
    <div className="desk-shell" style={shellStyle}>
      <aside className="desk-sidebar">
        <div className="desk-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="ATS Desk" />
          <h1>ATS Desk</h1>
        </div>

        <div className="desk-status">
          <span className="dot" style={{ opacity: checking ? 0.4 : 1 }} />
          {checking ? 'Conectando a ATS…' : online ? 'Conectado a ATS' : 'Desconectado de ATS'}
        </div>

        <form className="desk-connect-card" onSubmit={onConnect}>
          <input
            className="desk-input"
            placeholder="000 000"
            value={formatId(id)}
            onChange={(e) => setId(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="off"
          />
          <input
            className="desk-input desk-input-pass"
            placeholder="Contraseña (opcional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="desk-btn" type="submit" disabled={clean.length < 6}>
            Conectar
          </button>
        </form>

        <div className="desk-sidebar-footer">
          {user ? <span>{user.email}</span> : null}
          {!user ? (
            <button type="button" className="desk-btn desk-btn-ghost" onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
          ) : null}
          <button type="button" className="desk-btn desk-btn-ghost" onClick={() => navigate('/settings')}>
            Ajustes
          </button>
        </div>
      </aside>

      <main className="desk-main">
        <Outlet />
      </main>
    </div>
  );
}
