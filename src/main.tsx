import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import { useAuth } from './lib/useAuth';
import './styles/global.css';

function Root() {
  const { authed, attempt } = useAuth();
  const location = useLocation();
  if (location.pathname.startsWith('/team-pipeline-demo')) {
    return (
      <App />
    );
  }
  if (!authed) return <LoginPage onAttempt={attempt} />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
);
