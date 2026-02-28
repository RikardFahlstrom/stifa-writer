import { calcStifa } from '../utils/stifa.js';

function formatDistance(meters) {
  return (meters / 1000).toFixed(2) + ' km';
}

function formatElevation(meters) {
  return Math.round(meters) + ' m';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Human-friendly sport type label
function sportLabel(sportType) {
  const map = {
    Run: 'Run', TrailRun: 'Trail run', VirtualRun: 'Virtual run',
    Walk: 'Walk', Hike: 'Hike', Snowshoe: 'Snowshoe',
    Ride: 'Ride', MountainBikeRide: 'MTB', GravelRide: 'Gravel',
    VirtualRide: 'Virtual ride', EBikeRide: 'E-bike', EMountainBikeRide: 'E-MTB',
    NordicSki: 'Nordic ski', RollerSki: 'Roller ski',
  };
  return map[sportType] || sportType;
}

export default function ActivityCard({ activity, selected, onToggle, alreadyDone }) {
  const stifa = calcStifa(activity.distance, activity.total_elevation_gain);

  const classes = [
    'activity-card',
    selected ? 'selected' : '',
    alreadyDone ? 'already-done' : '',
  ].filter(Boolean).join(' ');

  function handleClick() {
    if (!alreadyDone) onToggle(activity.id);
  }

  return (
    <div className={classes} onClick={handleClick}>
      <input
        type="checkbox"
        className="card-checkbox"
        checked={selected}
        disabled={alreadyDone}
        onChange={() => onToggle(activity.id)}
        onClick={e => e.stopPropagation()}
        aria-label={`Select ${activity.name}`}
      />
      <div className="card-body">
        <div className="card-name" title={activity.name}>
          {activity.name}
        </div>

        <div className="card-meta">
          <span className="card-meta-item">
            📅 {formatDate(activity.start_date_local)}
          </span>
          <span className="card-meta-item">
            📏 {formatDistance(activity.distance)}
          </span>
          <span className="card-meta-item">
            ⛰️ {formatElevation(activity.total_elevation_gain)}
          </span>
          <span className="card-badge">{sportLabel(activity.sport_type || activity.type)}</span>
        </div>

        <div style={{ marginTop: '.4rem', display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {stifa !== null ? (
            <span className="card-stifa">
              stifa {stifa}
            </span>
          ) : (
            <span className="card-stifa null-stifa">No stifa data</span>
          )}

          {alreadyDone && (
            <span className="card-badge done">Already written</span>
          )}
        </div>
      </div>
    </div>
  );
}
