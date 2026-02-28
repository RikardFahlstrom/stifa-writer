/**
 * Netlify serverless function: Strava token exchange and refresh.
 *
 * Keeps STRAVA_CLIENT_SECRET server-side so it is never exposed to the browser.
 *
 * POST body (authorization_code grant):
 *   { grant_type: 'authorization_code', code: '...', redirect_uri: '...' }
 *
 * POST body (refresh_token grant):
 *   { grant_type: 'refresh_token', refresh_token: '...' }
 *
 * Returns: Strava token response (access_token, refresh_token, expires_at, ...)
 */
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { grant_type, code, refresh_token, redirect_uri } = payload;

  if (!grant_type) {
    return { statusCode: 400, body: 'Missing grant_type' };
  }

  const body = {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type,
    ...(grant_type === 'authorization_code'
      ? { code, redirect_uri }
      : { refresh_token }),
  };

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();

  return {
    statusCode: res.status,
    headers: { 'Content-Type': 'application/json' },
    body: responseText,
  };
}
