import Link from 'next/link';
import { headers } from 'next/headers';

const copy={
  fr:{title:'Page introuvable',text:'La page demandée n’existe pas ou n’est plus disponible.',back:'Retour à l’accueil'},
  en:{title:'Page not found',text:'The requested page does not exist or is no longer available.',back:'Back to home'},
  es:{title:'Página no encontrada',text:'La página solicitada no existe o ya no está disponible.',back:'Volver al inicio'},
};
export default async function NotFound() {
  const requested=(await headers()).get('x-nomade-lang');
  const lang=requested==='en'||requested==='es'?requested:'fr';
  const t=copy[lang];
  return (<><title>{`${t.title} | NOMADE — Foix`}</title>
    <main className="notFoundPage" lang={lang}>
      <p className="eyebrow">NOMADE · FOIX</p>
      <h1>{t.title}</h1>
      <p className="lead">{t.text}</p>
      <Link className="button" href={`/${lang}`}>{t.back}</Link>
    </main></>
  );
}
