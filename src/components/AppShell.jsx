import ActivityList from './ActivityList.jsx';
import StifaInsights from './StifaInsights.jsx';
import Footer from './Footer.jsx';

export default function AppShell({ page, onNavigate, onDisconnect, getToken }) {
  return (
    <div className="app-shell">
      {/* Global sticky navigation */}
      <header className="app-nav">
        <span className="app-nav-title">STIFA <span>info</span></span>

        <nav className="app-nav-tabs">
          <button
            className={`nav-tab${page === 'writer' ? ' active' : ''}`}
            onClick={() => onNavigate('writer')}
          >
            Writer
          </button>
          <button
            className={`nav-tab${page === 'insights' ? ' active' : ''}`}
            onClick={() => onNavigate('insights')}
          >
            Insights
          </button>
        </nav>

        <button className="btn btn-ghost app-nav-disconnect" onClick={onDisconnect}>
          Disconnect
        </button>
      </header>

      {/* Page content */}
      <main className="app-shell-content">
        {page === 'writer' && <ActivityList getToken={getToken} />}
        {page === 'insights' && <StifaInsights />}
      </main>

      <Footer />
    </div>
  );
}
