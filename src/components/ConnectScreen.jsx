import { buildAuthUrl } from '../api/strava.js';
import Footer from './Footer.jsx';

// Strava wordmark SVG (simplified)
function StravaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 4 13.828h4.17" />
    </svg>
  );
}

export default function ConnectScreen({ error, loading }) {
  const redirectUri = `${window.location.origin}/`;
  const authUrl = buildAuthUrl(redirectUri);

  return (
    <div className="page">
      <div className="card">
        <div className="app-header">
          <h1>STIFA <span>info</span></h1>
          <p>Connect your Strava account to continue.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Authenticating with Strava…</p>
          </div>
        ) : (
          <>
            <a href={authUrl} className="btn-strava">
              <StravaIcon />
              Connect with Strava
            </a>

            <p style={{ fontSize: '.78rem', color: 'var(--grey-600)', marginTop: '1rem', textAlign: 'center' }}>
              You'll be redirected to Strava to authorize access to your activities.
            </p>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
