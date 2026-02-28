import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllActivities, getActivityDetail, updateActivity } from '../api/strava.js';
import { calcStifa, formatStifaBlock, alreadyHasStifa } from '../utils/stifa.js';
import ActivityCard from './ActivityCard.jsx';
import WriteBar from './WriteBar.jsx';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_RANGES = [
  { label: 'Last 7 days', getAfter: () => Math.floor(Date.now() / 1000) - 7 * 86400 },
  { label: 'Last 30 days', getAfter: () => Math.floor(Date.now() / 1000) - 30 * 86400 },
  {
    label: 'This year',
    getAfter: () => Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000),
  },
  { label: 'All time', getAfter: () => null },
];

const ACTIVITY_TYPES = [
  { label: 'All', sportTypes: null },
  {
    label: 'Foot sports',
    sportTypes: ['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike', 'Snowshoe'],
  },
  {
    label: 'Cycle sports',
    sportTypes: ['Ride', 'MountainBikeRide', 'GravelRide', 'VirtualRide', 'EBikeRide', 'EMountainBikeRide'],
  },
  { label: 'Nordic ski', sportTypes: ['NordicSki'] },
  { label: 'Roller ski', sportTypes: ['RollerSki'] },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActivityList({ getToken }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [fetchError, setFetchError] = useState('');

  const [timeRangeIdx, setTimeRangeIdx] = useState(0);
  const [typeIdx, setTypeIdx] = useState(0);

  const [selected, setSelected] = useState(new Set());
  const [writing, setWriting] = useState(false);
  const [results, setResults] = useState([]);

  // Track which activities already have stifa written (by id)
  const [writtenIds, setWrittenIds] = useState(new Set());

  const fetchRef = useRef(0);

  // ── Fetch activities when time range changes ───────────────────────────────
  useEffect(() => {
    const fetchId = ++fetchRef.current;

    setActivities([]);
    setSelected(new Set());
    setResults([]);
    setFetchError('');
    setLoadedCount(0);
    setLoading(true);

    const after = TIME_RANGES[timeRangeIdx].getAfter();

    getToken()
      .then(token =>
        getAllActivities(token, after, count => {
          if (fetchId === fetchRef.current) setLoadedCount(count);
        })
      )
      .then(data => {
        if (fetchId !== fetchRef.current) return;
        setActivities(data);
      })
      .catch(err => {
        if (fetchId !== fetchRef.current) return;
        setFetchError(err.message);
      })
      .finally(() => {
        if (fetchId !== fetchRef.current) return;
        setLoading(false);
      });
  }, [timeRangeIdx, getToken]);

  // ── Client-side type filter ───────────────────────────────────────────────
  const selectedTypes = ACTIVITY_TYPES[typeIdx].sportTypes;

  const visibleActivities = selectedTypes
    ? activities.filter(a => {
        const t = a.sport_type || a.type;
        return selectedTypes.includes(t);
      })
    : activities;

  // Activities eligible for selection (not already written, have stifa data)
  const eligibleIds = visibleActivities
    .filter(a => !writtenIds.has(a.id) && calcStifa(a.distance, a.total_elevation_gain) !== null)
    .map(a => a.id);

  // ── Select all toggle ─────────────────────────────────────────────────────
  const allEligibleSelected =
    eligibleIds.length > 0 && eligibleIds.every(id => selected.has(id));

  function handleSelectAll() {
    if (allEligibleSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        eligibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        eligibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  }

  function handleToggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Write stifa ───────────────────────────────────────────────────────────
  const handleWrite = useCallback(async () => {
    const ids = [...selected].filter(id => !writtenIds.has(id));
    if (ids.length === 0) return;

    setWriting(true);
    setResults([]);

    const newResults = [];
    const newWritten = new Set(writtenIds);

    for (const id of ids) {
      try {
        const token = await getToken();
        const detail = await getActivityDetail(token, id);

        if (alreadyHasStifa(detail.description)) {
          newResults.push({ id, name: detail.name, status: 'skip' });
          newWritten.add(id);
          continue;
        }

        const activity = activities.find(a => a.id === id);
        const stifaVal = calcStifa(activity.distance, activity.total_elevation_gain);

        if (stifaVal === null) {
          newResults.push({ id, name: detail.name, status: 'error', msg: 'No distance data' });
          continue;
        }

        const newDescription = (detail.description || '') + formatStifaBlock(stifaVal);
        await updateActivity(token, id, newDescription);

        newResults.push({ id, name: detail.name, status: 'success', stifa: stifaVal });
        newWritten.add(id);
      } catch (err) {
        const act = activities.find(a => a.id === id);
        newResults.push({ id, name: act?.name || id, status: 'error', msg: err.message });
      }

      setResults([...newResults]);
    }

    setWrittenIds(newWritten);
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setWriting(false);
  }, [selected, writtenIds, activities, getToken]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="list-screen">
      {/* Sticky filter header */}
      <header className="list-header">
        {/* Time range chips */}
        <div className="filter-section">
          <div className="filter-label">Time range</div>
          <div className="filter-bar">
            {TIME_RANGES.map((r, i) => (
              <button
                key={r.label}
                className={`chip${timeRangeIdx === i ? ' active' : ''}`}
                onClick={() => { setTypeIdx(0); setTimeRangeIdx(i); }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity type chips */}
        <div className="filter-section">
          <div className="filter-label">Activity type</div>
          <div className="filter-bar">
            {ACTIVITY_TYPES.map((t, i) => (
              <button
                key={t.label}
                className={`chip${typeIdx === i ? ' active' : ''}`}
                onClick={() => setTypeIdx(i)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Select all row */}
        {!loading && visibleActivities.length > 0 && (
          <label className="select-all-row">
            <input
              type="checkbox"
              checked={allEligibleSelected}
              onChange={handleSelectAll}
              disabled={eligibleIds.length === 0}
            />
            {allEligibleSelected ? 'Deselect all' : 'Select all'}
            {eligibleIds.length > 0 && (
              <span style={{ color: 'var(--grey-400)', fontWeight: 400 }}>
                &nbsp;({eligibleIds.length} eligible)
              </span>
            )}
          </label>
        )}
      </header>

      {/* Scrollable list */}
      <main className="activity-scroll">
        {fetchError && <div className="error-banner">{fetchError}</div>}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>
              {loadedCount > 0
                ? `Loaded ${loadedCount} activities…`
                : 'Fetching activities…'}
            </p>
          </div>
        )}

        {!loading && visibleActivities.length === 0 && !fetchError && (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2a4 4 0 014-4h4M9 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v6" />
            </svg>
            <p>No activities found for this period.</p>
          </div>
        )}

        {!loading &&
          visibleActivities.map(a => (
            <ActivityCard
              key={a.id}
              activity={a}
              selected={selected.has(a.id)}
              onToggle={handleToggle}
              alreadyDone={writtenIds.has(a.id)}
            />
          ))}

        {/* Write results */}
        {results.length > 0 && (
          <div className="results-section">
            <h2>Results</h2>
            {results.map(r => (
              <div
                key={r.id}
                className={`result-banner ${r.status}`}
              >
                {r.status === 'success' && `✓ ${r.name} — stifa ${r.stifa} written`}
                {r.status === 'skip' && `⚠ ${r.name} — already has stifa, skipped`}
                {r.status === 'error' && `✗ ${r.name} — ${r.msg}`}
              </div>
            ))}
          </div>
        )}
      </main>

      <WriteBar
        selectedCount={selected.size}
        onWrite={handleWrite}
        writing={writing}
      />
    </div>
  );
}
