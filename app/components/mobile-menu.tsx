'use client';

import { useRef, type ReactNode } from 'react';

export default function MobileMenu({children}:{children:ReactNode}) {
  const menu=useRef<HTMLDetailsElement>(null);
  return <details ref={menu} className="mobileMenu" onClick={event=>{
    if(event.target instanceof Element && event.target.closest('a'))event.currentTarget.open=false;
  }} onKeyDown={event=>{
    if(event.key==='Escape' && menu.current?.open) {
      menu.current.open=false;
      menu.current.querySelector('summary')?.focus();
    }
  }}>{children}</details>;
}
