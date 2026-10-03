import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { localized, readMenu, sortedMenu, type Lang } from '../../../lib/menu';
import { isSiteLanguage, pageMetadata, siteUrl } from '../../../lib/seo';

const labels = {
  fr: { title:'La carte', description:'Découvrez la carte de NOMADE, restaurant et bar à Foix.', back:'Retour à l’accueil', unavailable:'Indisponible', composition:'Composition' },
  en: { title:'The menu', description:'Discover the menu at NOMADE, restaurant and bar in Foix.', back:'Back to home', unavailable:'Unavailable', composition:'Ingredients' },
  es: { title:'La carta', description:'Descubre la carta de NOMADE, restaurante y bar en Foix.', back:'Volver al inicio', unavailable:'No disponible', composition:'Ingredientes' },
};
const categoryLabels: Record<Lang, Record<string, string>> = {
  fr: {},
  en: { Entrées: 'Starters', Plats: 'Main courses', Desserts: 'Desserts', Enfant: 'Children', Boissons: 'Drinks' },
  es: { Entrées: 'Entrantes', Plats: 'Platos principales', Desserts: 'Postres', Enfant: 'Niños', Boissons: 'Bebidas' },
};
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!isSiteLanguage(rawLang)) notFound();
  const t = labels[rawLang];
  return pageMetadata(rawLang, '/carte', `${t.title} | NOMADE — Foix`, t.description);
}

export default async function Carte({params}: {params: Promise<{lang:string}>}) {
  const {lang: input} = await params;
  if (!['fr','en','es'].includes(input)) notFound();
  const lang = input as Lang, t = labels[lang];
  const items = sortedMenu(await readMenu());
  const categories = [...new Set(items.map(d => d.category))];
  const menuSections = categories.map(category => ({
    '@type': 'MenuSection',
    name: categoryLabels[lang][category] ?? category,
    hasMenuItem: items.filter(dish => dish.category === category && dish.available).map(dish => {
      const content = localized(dish, lang);
      return {
        '@type': 'MenuItem',
        '@id': `${siteUrl}/${lang}/carte#dish-${dish.id}`,
        name: content.name,
        ...(content.description ? { description: content.description } : {}),
      };
    }),
  })).filter(section => section.hasMenuItem.length > 0);
  const menuStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${siteUrl}/${lang}/carte#menu`,
    name: `${t.title} — NOMADE`,
    url: `${siteUrl}/${lang}/carte`,
    inLanguage: lang,
    hasMenuSection: menuSections,
  };
  return <main className="legalPage menuPage" lang={lang}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuStructuredData).replace(/</g, '\\u003c') }} />
    <Link className="textLink" href={`/${lang}`}>← {t.back}</Link>
    <div className="legalHead"><p className="eyebrow">NOMADE · FOIX</p><h1>{t.title}</h1></div>
    <nav className="menuLanguageSwitcher" aria-label="Menu language">{(['fr', 'en', 'es'] as const).map(language => <Link key={language} className={language === lang ? 'active' : ''} href={`/${language}/carte`} aria-current={language === lang ? 'page' : undefined}>{language.toUpperCase()}</Link>)}</nav>
    {items.length === 0 && <p className="muted">{lang === 'fr' ? 'La carte arrive bientôt.' : lang === 'en' ? 'The menu is coming soon.' : 'La carta estará disponible pronto.'}</p>}
    {categories.map(category => <section key={category} className="menuCategory"><h2>{categoryLabels[lang][category] ?? category}</h2>
      {items.filter(d => d.category === category).map(d => {
        const content = localized(d,lang);
        return <article className="menuItem" key={d.id}>
          <div><h3>{content.name}</h3>{content.description && <p>{content.description}</p>}{content.ingredients && <small><strong>{t.composition}:</strong> {content.ingredients}</small>}{!d.available && <p>{t.unavailable}</p>}</div>
        </article>;
      })}
    </section>)}
  </main>;
}
