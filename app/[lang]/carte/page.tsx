import Link from 'next/link';
import { notFound } from 'next/navigation';
import { localized, readMenu, sortedMenu, type Lang } from '../../../lib/menu';

const labels = {
  fr: { title:'La carte', back:'Retour à l’accueil', unavailable:'Indisponible', composition:'Composition' },
  en: { title:'The menu', back:'Back to home', unavailable:'Unavailable', composition:'Composition' },
  es: { title:'La carta', back:'Volver al inicio', unavailable:'No disponible', composition:'Composición' },
};
export const dynamic = 'force-dynamic';

export default async function Carte({params}: {params: Promise<{lang:string}>}) {
  const {lang: input} = await params;
  if (!['fr','en','es'].includes(input)) notFound();
  const lang = input as Lang, t = labels[lang];
  const items = sortedMenu(await readMenu());
  const categories = [...new Set(items.map(d => d.category))];
  return <main className="legalPage menuPage" lang={lang}>
    <Link className="textLink" href={`/${lang}`}>← {t.back}</Link>
    <div className="legalHead"><p className="eyebrow">NOMADE · FOIX</p><h1>{t.title}</h1></div>
    <nav className="menuLanguageSwitcher" aria-label="Menu language">{(['fr', 'en', 'es'] as const).map(language => <Link key={language} className={language === lang ? 'active' : ''} href={`/${language}/carte`} aria-current={language === lang ? 'page' : undefined}>{language.toUpperCase()}</Link>)}</nav>
    {items.length === 0 && <p className="muted">{lang === 'fr' ? 'La carte arrive bientôt.' : lang === 'en' ? 'The menu is coming soon.' : 'La carta estará disponible pronto.'}</p>}
    {categories.map(category => <section key={category} className="menuCategory"><h2>{category}</h2>
      {items.filter(d => d.category === category).map(d => {
        const content = localized(d,lang);
        return <article className="menuItem" key={d.id}>
          <div><h3>{content.name}</h3>{content.description && <p>{content.description}</p>}{content.ingredients && <small><strong>{t.composition}:</strong> {content.ingredients}</small>}{!d.available && <p>{t.unavailable}</p>}</div>
        </article>;
      })}
    </section>)}
  </main>;
}
