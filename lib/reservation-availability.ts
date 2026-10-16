const sheetsWebhook = 'https://script.google.com/macros/s/AKfycbyIyOWq3t4XFYFjZJGpEYJpYvfOmriYIP8-PIAORzf2KBtWChSr1RT1rMqi4TQSJRuY/exec';

function reservationsToken() {
  return process.env.NOMADE_RESERVATIONS_TOKEN?.trim() ?? '';
}

/**
 * The reservation dashboard is the single source of truth for restaurant-wide
 * closures. Keep the token on the server and share this lookup with lunch.
 */
export async function reservationClosedDates() {
  const token = reservationsToken();
  if (!token) throw new Error('Reservations token is not configured');
  const url = new URL(sheetsWebhook);
  url.searchParams.set('token', token);
  url.searchParams.set('action', 'getClosures');
  const response = await fetch(url, { cache:'no-store', signal:AbortSignal.timeout(8000) });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok || !Array.isArray(body.closedDates)) throw new Error('Availability service failed');
  return body.closedDates
    .map((item:unknown) => typeof item === 'string' ? item : item && typeof item === 'object' && 'date' in item ? item.date : '')
    .filter((date:unknown):date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date));
}
