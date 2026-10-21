export function languageFromPathname(pathname:string|null):'fr'|'en'|'es' {
  const lang=pathname?.split('/')[1];
  return lang==='en'||lang==='es'?lang:'fr';
}
