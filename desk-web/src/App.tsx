import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RemotePage from '@/pages/RemotePage';
import SettingsPage from '@/pages/SettingsPage';
import Layout from '@/components/Layout';

function ThemedApp() {
  const { colors } = useTheme();
  return (
    <div
      className="app-shell"
      style={
        {
          background: colors.bg,
          color: colors.text,
          '--accent': colors.accent,
          '--border': colors.border,
          '--card': colors.bgCard,
          '--text': colors.text,
          '--text-secondary': colors.textSecondary,
          '--btn-text': colors.accent === '#FFFFFF' ? '#121214' : '#FFFFFF',
        } as React.CSSProperties
      }
    >
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="remote/:id" element={<RemotePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
