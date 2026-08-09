import { DeskConfig } from '@/config/desk';
import { useAuth } from '@/auth/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeMode } from '@/theme/colors';

const OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
  { key: 'albesa', label: 'Albesa Tech' },
];

export default function SettingsPage() {
  const { mode, setMode, colors } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card">
        <h2 style={{ margin: '0 0 12px' }}>Apariencia</h2>
        <div className="theme-grid">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`theme-chip${mode === opt.key ? ' active' : ''}`}
              onClick={() => setMode(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 12px' }}>Servidor</h2>
        <p className="meta">ID (hbbs) · {DeskConfig.rendezvousServer}</p>
        <p className="meta">Relay · {DeskConfig.relayServer}</p>
        <p className="meta">WebSocket · {DeskConfig.webSocketHost}</p>
      </div>

      {user ? (
        <div className="card">
          <p style={{ margin: '0 0 12px' }}>{user.email}</p>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
