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
  const { mode, setMode } = useTheme();
  const { user, logout } = useAuth();

  return (
    <>
      <div className="desk-main-header">
        <h2>Ajustes</h2>
      </div>

      <div className="desk-card" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Apariencia</h3>
        <div className="theme-row">
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

      <div className="desk-card">
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Servidor</h3>
        <p className="meta">ID · {DeskConfig.rendezvousServer}</p>
        <p className="meta">Relay · {DeskConfig.relayServer}</p>
        <p className="meta">WebSocket · {DeskConfig.webSocketHost}</p>
      </div>

      {user ? (
        <div className="desk-card" style={{ marginTop: 16 }}>
          <p style={{ margin: '0 0 12px' }}>{user.email}</p>
          <button type="button" className="desk-btn desk-btn-ghost" onClick={() => logout()}>
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </>
  );
}
