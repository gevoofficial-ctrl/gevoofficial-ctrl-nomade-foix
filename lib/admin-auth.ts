import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const cookieName = 'nomade_admin';
const secret = () => process.env.NOMADE_ADMIN_SECRET;
const password = () => process.env.NOMADE_ADMIN_PASSWORD;
export const configured = () => Boolean(secret() && password() && secret()!.length >= 32);
const equal = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export const validPassword = (value: unknown) => configured() && typeof value === 'string' && equal(value, password()!);
export function newSession() {
  const expiry = String(Math.floor(Date.now() / 1000) + 12 * 3600);
  return expiry + '.' + createHmac('sha256', secret()!).update(expiry).digest('hex');
}
export function authorized(request: NextRequest) {
  if (!configured()) return false;
  const token = request.cookies.get(cookieName)?.value ?? '';
  const [expiry, signature, extra] = token.split('.');
  if (extra || !/^\d{10}$/.test(expiry ?? '') || !/^[a-f0-9]{64}$/.test(signature ?? '') || Number(expiry) < Date.now()/1000) return false;
  return equal(signature, createHmac('sha256', secret()!).update(expiry).digest('hex'));
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.host === request.headers.get('host') &&
      (url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.protocol === 'http:'));
  } catch { return false; }
}
