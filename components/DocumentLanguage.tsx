'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { languageFromPathname } from '../lib/site-language';

export default function DocumentLanguage(){
  const pathname=usePathname();
  useEffect(()=>{document.documentElement.lang=languageFromPathname(pathname);},[pathname]);
  return null;
}
