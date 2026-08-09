import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useTheme } from '@/theme/ThemeContext';

export default function Layout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { online, checking } = useServerStatus();
  const navigate = useNavigate();

  return (
    <>
      <header className="topbar" style={{ background: colors.bgCard }}>
        <button type="button" className="brand btn-ghost btn" style={{ padding: '8px 12px' }} onClick={() => navigate('/')}>
          ATS Desk
        </button>
        <div className="row">
          <span className="status-pill" style={{ color: colors.textSecondary }}>
            <span className="dot" style={{ opacity: checking ? 0.4 : 1, background: online ? colors.accent : colors.offline }} />
            {checking ? 'Comprobando…' : online ? 'En línea' : 'Sin conexión'}
          </span>
          {user ? (
            <Link to="/settings" className="btn btn-ghost" style={{ padding: '8px 14px', textDecoration: 'none' }}>
              {user.email}
            </Link>
          ) : (
            <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 14px', textDecoration: 'none' }}>
              Entrar
            </Link>
          )}
          <Link to="/settings" className="btn btn-ghost" style={{ padding: '8px 14px', textDecoration: 'none' }}>
            Ajustes
          </Link>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  );
}
