import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import DesktopLayout from '@/components/DesktopLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RemotePage from '@/pages/RemotePage';
import SettingsPage from '@/pages/SettingsPage';

function ThemedApp() {
  const { colors } = useTheme();
  return (
    <div
      style={
        {
          minHeight: '100vh',
          background: colors.bg,
          color: colors.text,
        } as React.CSSProperties
      }
    >
      <BrowserRouter>
        <Routes>
          <Route element={<DesktopLayout />}>
            <Route index element={<HomePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="login" element={<LoginPage />} />
          <Route path="remote/:id" element={<RemotePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
