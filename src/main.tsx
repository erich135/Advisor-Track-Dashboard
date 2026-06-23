import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import { useAuth } from './lib/useAuth';
import './styles/global.css';

function Root() {
  const { authed, attempt } = useAuth();
  if (!authed) return <LoginPage onAttempt={attempt} />;
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
