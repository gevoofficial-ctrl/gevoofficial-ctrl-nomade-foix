'use client';

import type { ReactNode } from 'react';

export const COOKIE_SETTINGS_EVENT = 'nomade:open-cookie-settings';

export default function CookieSettingsButton({ children }: { children: ReactNode }) {
  return <button className="footerCookieSettings" type="button" onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}>{children}</button>;
}
