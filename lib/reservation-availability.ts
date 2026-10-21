const sheetsWebhook = 'https://script.google.com/macros/s/AKfycbyIyOWq3t4XFYFjZJGpEYJpYvfOmriYIP8-PIAORzf2KBtWChSr1RT1rMqi4TQSJRuY/exec';
const lunchClosureCacheTtlMs = 20_000;
let lunchClosureCache: { dates:string[]; expiresAt:number }|null = null;
let lunchClosureRequest: Promise<string[]>|null = null;
let closureGeneration=0;

class AvailabilityError extends Error {
  constructor(public retryable:boolean) {super('Availability service failed');}
}

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
  const deadline=AbortSignal.timeout(12000);
  for(let attempt=0;attempt<2;attempt++) {
    try {
      const response=await fetch(url,{cache:'no-store',signal:AbortSignal.any([deadline,AbortSignal.timeout(8000)])});
      if(!response.ok)throw new AvailabilityError(![401,403].includes(response.status));
      const body=await response.json();
      if(!body?.ok || !Array.isArray(body.closedDates))throw new AvailabilityError(false);
      return body.closedDates
        .map((item:unknown)=>typeof item==='string'?item:item&&typeof item==='object'&&'date' in item?item.date:'')
        .filter((date:unknown):date is string=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date));
    } catch(error) {
      if(attempt===1 || deadline.aborted || (error instanceof AvailabilityError && !error.retryable))throw new Error('Availability service failed');
      await new Promise(resolve=>setTimeout(resolve,200));
    }
  }
  throw new Error('Availability service failed');
}

export function invalidateReservationAvailability() {
  closureGeneration++;
  lunchClosureCache=null;
  lunchClosureRequest=null;
}

/**
 * Keep repeated lunch-calendar opens responsive without relaxing checkout
 * safety. The order endpoint deliberately calls reservationClosedDates()
 * directly, so it always rechecks the current reservation closure list.
 */
export async function lunchReservationClosedDates() {
  if (lunchClosureCache && lunchClosureCache.expiresAt>Date.now()) return [...lunchClosureCache.dates];
  if (!lunchClosureRequest) {
    const generation=closureGeneration;
    const pending=reservationClosedDates()
      .then(dates=>{
        if(generation===closureGeneration)lunchClosureCache={dates:[...dates],expiresAt:Date.now()+lunchClosureCacheTtlMs};
        return dates;
      })
      .finally(()=>{if(lunchClosureRequest===pending)lunchClosureRequest=null;});
    lunchClosureRequest=pending;
  }
  return (await lunchClosureRequest).slice();
}
