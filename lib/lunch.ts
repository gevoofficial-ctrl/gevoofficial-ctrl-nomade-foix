import type { Dish } from './menu';

export const lunchImageSizes='(max-width:380px) 78vw, (max-width:388px) 280px, (max-width:800px) 72vw, 280px';

/** Pickup is available every ten minutes from 12:00 through 14:00 inclusive. */
export const pickupSlots = Array.from({ length:13 }, (_, i) => {
  const minutes = 720 + i * 10;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
});
export function frenchNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(now);
  const get = (type:string) => parts.find(part => part.type === type)?.value || '';
  return { date:`${get('year')}-${get('month')}-${get('day')}`, minutes:Number(get('hour')) * 60 + Number(get('minute')) };
}
export function isWeekday(value:unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value && date.getUTCDay() > 0 && date.getUTCDay() < 6;
}
export function allowedDate(value:unknown, now = new Date()): value is string {
  if (!isWeekday(value)) return false;
  const french = frenchNow(now);
  return value > french.date || (value === french.date && french.minutes >= 570 && french.minutes <= 690);
}
export function nextPickupDate(now = new Date(), closedDates:readonly string[] = []) {
  const french = frenchNow(now);
  const date = new Date(`${french.date}T12:00:00Z`);
  if (french.minutes > 690) date.setUTCDate(date.getUTCDate() + 1);
  while (!isWeekday(date.toISOString().slice(0,10)) || closedDates.includes(date.toISOString().slice(0,10))) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0,10);
}
export function lunchKind(dish: Pick<Dish,'category'>): 'main'|'drink'|null {
  const category = dish.category.trim().toLocaleLowerCase('fr');
  return category === 'plats' ? 'main' : category === 'boissons' ? 'drink' : null;
}
export function lunchAvailable(dish:Dish) {
  return dish.available && dish.lunchIncluded && Number.isSafeInteger(dish.lunchPriceCents) && (dish.lunchPriceCents ?? 0) > 0 && lunchKind(dish) !== null;
}
/** Each category earns its own special price once four items in that category are selected. */
export function hasLunchSpecialPrice(itemCount:number) { return itemCount >= 4; }
export function lunchLinePrice(dish:Dish, kind:'main'|'drink', mainCount:number, drinkCount:number) {
  const price = hasLunchSpecialPrice(kind === 'main' ? mainCount : drinkCount) ? dish.lunchPriceCents : dish.regularPriceCents;
  return Number.isSafeInteger(price) && (price ?? 0) > 0 ? price : null;
}
export function euros(cents:number) { return `${(cents / 100).toFixed(2).replace('.', ',')} €`; }
