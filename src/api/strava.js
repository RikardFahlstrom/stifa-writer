const BASE = 'https://www.strava.com/api/v3';

// ── Token management (via Netlify function) ───────────────────────────────────
// The Netlify function at /.netlify/functions/strava-token holds the
// client_secret server-side so it is never exposed in the browser.

export async function exchangeToken(code, redirectUri) {
  const res = await fetch('/.netlify/functions/strava-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken) {
  const res = await fetch('/.netlify/functions/strava-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

// ── Activities ────────────────────────────────────────────────────────────────

/**
 * Fetch a single page of activities.
 * @param {string} token - Access token
 * @param {number} page  - 1-based page number
 * @param {number|null} after - Unix timestamp; only return activities after this time
 */
async function fetchActivityPage(token, page, after) {
  const params = new URLSearchParams({ per_page: 30, page });
  if (after != null) params.set('after', after);
  const res = await fetch(`${BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch activities: ${res.status}`);
  return res.json();
}

/**
 * Fetch all activities within the optional time range, auto-paginating.
 * @param {string} token
 * @param {number|null} after - Unix timestamp or null for all time
 * @param {function} onProgress - called with count of loaded activities as pages arrive
 */
export async function getAllActivities(token, after, onProgress) {
  const all = [];
  let page = 1;
  while (true) {
    const batch = await fetchActivityPage(token, page, after);
    if (batch.length === 0) break;
    all.push(...batch);
    if (onProgress) onProgress(all.length);
    if (batch.length < 30) break; // last page
    page++;
  }
  return all;
}

/**
 * Fetch the full detail of a single activity (includes description).
 */
export async function getActivityDetail(token, id) {
  const res = await fetch(`${BASE}/activities/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch activity ${id}: ${res.status}`);
  return res.json();
}

/**
 * Update the description of an activity.
 * Only sends the description field — all other fields are preserved by Strava.
 */
export async function updateActivity(token, id, description) {
  const res = await fetch(`${BASE}/activities/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error(`Failed to update activity ${id}: ${res.status}`);
  return res.json();
}

// ── OAuth URL builder ─────────────────────────────────────────────────────────

/**
 * Build the Strava authorization URL.
 * client_id is read from the VITE_STRAVA_CLIENT_ID environment variable
 * (safe to expose in the browser — only the client_secret must stay server-side).
 */
export function buildAuthUrl(redirectUri) {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:read_all,activity:write',
    approval_prompt: 'auto',
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}
