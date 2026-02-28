import { useState, useEffect, useCallback } from 'react';
import { exchangeToken, refreshAccessToken } from './api/strava.js';
import ConnectScreen from './components/ConnectScreen.jsx';
import AppShell from './components/AppShell.jsx';

const LS = {
  accessToken: 'stifa_access_token',
  refreshToken: 'stifa_refresh_token',
  expiresAt: 'stifa_expires_at',
};

function loadToken() {
  return {
    accessToken: localStorage.getItem(LS.accessToken),
    refreshToken: localStorage.getItem(LS.refreshToken),
    expiresAt: Number(localStorage.getItem(LS.expiresAt)) || 0,
  };
}

function saveToken({ access_token, refresh_token, expires_at }) {
  localStorage.setItem(LS.accessToken, access_token);
  localStorage.setItem(LS.refreshToken, refresh_token);
  localStorage.setItem(LS.expiresAt, expires_at);
}

function clearToken() {
  [LS.accessToken, LS.refreshToken, LS.expiresAt].forEach(k =>
    localStorage.removeItem(k)
  );
}

export default function App() {
  const [token, setToken] = useState(loadToken);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState('writer'); // 'writer' | 'insights'

  // Check URL for OAuth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setAuthError('Strava authorization was denied.');
      window.history.replaceState({}, '', '/');
      return;
    }

    if (!code) return;

    // Remove code from URL immediately
    window.history.replaceState({}, '', '/');

    const redirectUri = `${window.location.origin}/`;

    setLoading(true);
    exchangeToken(code, redirectUri)
      .then(data => {
        saveToken(data);
        setToken(loadToken());
      })
      .catch(err => setAuthError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Get a valid access token, refreshing if needed
  const getValidToken = useCallback(async () => {
    const { accessToken, refreshToken: rt, expiresAt } = loadToken();
    if (!accessToken) throw new Error('Not authenticated');

    // Refresh if token expires within 5 minutes
    if (Date.now() / 1000 > expiresAt - 300) {
      const data = await refreshAccessToken(rt);
      saveToken(data);
      setToken(loadToken());
      return data.access_token;
    }

    return accessToken;
  }, []);

  const handleDisconnect = useCallback(() => {
    clearToken();
    setToken(loadToken());
    setAuthError('');
    setPage('writer');
  }, []);

  // ── Screen routing ──────────────────────────────────────────────────────────
  const hasToken = Boolean(token.accessToken);

  if (!hasToken) {
    return (
      <ConnectScreen
        error={authError}
        loading={loading}
      />
    );
  }

  return (
    <AppShell
      page={page}
      onNavigate={setPage}
      onDisconnect={handleDisconnect}
      getToken={getValidToken}
    />
  );
}
