import Link from 'next/link';
import { notFound } from 'next/navigation';
import { localized, readMenu, sortedMenu, type Lang } from '../../../lib/menu';

const labels = {
  fr: { title: 'La carte', back: 'Retour à l’accueil', unavailable: 'Indisponible', allergens: 'Allergènes' },
  en: { title: 'The menu', back: 'Back to home', unavailable: 'Unavailable', allergens: 'Allergens' },
  es: { title: 'La carta', back: 'Volver al inicio', unavailable: 'No disponible', allergens: 'Alérgenos' },
};
export const dynamic = 'force-dynamic';
export default async function Carte({params}: {params: Promise<{lang:string}>}) {
  const {lang: input} = await params;
  if (!['fr','en','es'].includes(input)) notFound();
  const lang = input as Lang, t = labels[lang];
  const items = sortedMenu(await readMenu());
  const categories = [...new Set(items.map(d => d.category))];
  const money = new Intl.NumberFormat(lang, { style:'currency', currency:'EUR' });
  return <main className="legalPage menuPage" lang={lang}>
    <Link className="textLink" href={`/${lang}`}>← {t.back}</Link>
    <div className="legalHead"><p className="eyebrow">NOMADE · FOIX</p><h1>{t.title}</h1></div>
    {items.length === 0 && <p className="muted">{lang === 'fr' ? 'La carte arrive bientôt.' : lang === 'en' ? 'The menu is coming soon.' : 'La carta estará disponible pronto.'}</p>}
    {categories.map(category => <section key={category} className="menuCategory"><h2>{items.find(d => d.category === category)?.categoryTranslations?.[lang] || category}</h2>
      {items.filter(d => d.category === category).map(d => { const content = localized(d,lang); return <article className="menuItem" key={d.id}>
        {d.videoUrl ? <video className="menuItemMedia" controls preload="none" poster={d.imageUrl || undefined} src={d.videoUrl} /> : d.imageUrl && <div className="menuItemMedia" style={{backgroundImage:`url('${d.imageUrl.replaceAll("'", '%27')}')`}}/>}
        <div><h3>{content.name}</h3><p>{content.description}</p><small>{d.allergens.length > 0 && `${t.allergens}: ${d.allergens.join(', ')} · `}{[d.vegetarian && 'Vegetarian',d.vegan && 'Vegan',d.glutenFree && 'Gluten-free'].filter(Boolean).join(' · ')}</small>{!d.available && <p>{t.unavailable}</p>}</div>
        <strong>{money.format(d.priceCents/100)}</strong>
      </article>})}
    </section>)}
  </main>;
}
