import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import { ToastProvider } from './components/ui';
import { useAuth } from './lib/useAuth';
import './styles/global.css';

function Root() {
  const { status, authed, login } = useAuth();
  const location = useLocation();

  // Team Pipeline demo stays isolated from real Abel auth.
  if (location.pathname.startsWith('/team-pipeline-demo')) {
    return <App />;
  }

  if (status === 'booting') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-white)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-muted)',
          fontFamily: 'inherit',
          fontSize: 14,
        }}
      >
        Checking session…
      </div>
    );
  }

  if (!authed) return <LoginPage onLogin={login} />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
