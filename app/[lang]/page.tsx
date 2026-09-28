import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const copy = {
  fr: {
    nav:['La maison','La carte','Événements','Contact'], heroKicker:'Restaurant · Bar · Foix', heroTitle:'Cuisine au feu.', heroSub:'Produits locaux · Influences du monde', reserve:'Réserver une table', discover:'Découvrir', fire:'Le feu est notre point de départ.', fireText:"Une cuisine libre, généreuse et instinctive. Des produits d’ici, des inspirations d’ailleurs. Nomade, c’est un voyage au cœur de l’Ariège.", local:'D’ici. D’ailleurs.', localText:'Nous travaillons avec des producteurs locaux et des saveurs du monde pour créer une cuisine sincère, vivante et sans frontières.', signatures:'Nos signatures', menu:'Voir la carte complète', events:'Événements & privatisation', atmosphere:'Une atmosphère unique à Foix', find:'Nous trouver', allergens:'Allergènes'
  },
  en: {
    nav:['The house','The menu','Events','Contact'], heroKicker:'Restaurant · Bar · Foix', heroTitle:'Cooking with fire.', heroSub:'Local produce · Global influences', reserve:'Book a table', discover:'Discover', fire:'Fire is where we begin.', fireText:'A free, generous and instinctive cuisine. Local produce, influences from elsewhere. Nomade is a journey through Ariège.', local:'From here. From elsewhere.', localText:'Local producers and flavours from around the world meet in a sincere, lively cuisine without borders.', signatures:'Our signatures', menu:'View full menu', events:'Events & private dining', atmosphere:'A unique atmosphere in Foix', find:'Find us', allergens:'Allergens'
  },
  es: {
    nav:['La casa','La carta','Eventos','Contacto'], heroKicker:'Restaurante · Bar · Foix', heroTitle:'Cocina al fuego.', heroSub:'Productos locales · Influencias del mundo', reserve:'Reservar una mesa', discover:'Descubrir', fire:'El fuego es nuestro punto de partida.', fireText:'Una cocina libre, generosa e instintiva. Productos locales e influencias de otros lugares. Nomade es un viaje por Ariège.', local:'De aquí. De allá.', localText:'Productores locales y sabores del mundo se encuentran en una cocina sincera, viva y sin fronteras.', signatures:'Nuestros platos', menu:'Ver la carta completa', events:'Eventos y espacios privados', atmosphere:'Una atmósfera única en Foix', find:'Dónde estamos', allergens:'Alérgenos'
  }
};

const photoAlt = {
  fr: {
    house: 'Table intime, pierre éclairée et bois dans la salle de NOMADE',
    wine: 'Verre de vin sur une table près de l’olivier et de la baie ouverte de NOMADE',
    dining: 'Salle de NOMADE, tables en bois et luminaires dans une lumière chaleureuse',
    facade: 'Façade en pierre de NOMADE et tables de la terrasse',
    terrace: 'Table haute et olivier devant la baie vitrée de NOMADE',
  },
  en: {
    house: 'An intimate table, illuminated stone and wood inside NOMADE',
    wine: 'A glass of wine beside an olive tree and the open window at NOMADE',
    dining: 'The NOMADE dining room with wooden tables and warm pendant lighting',
    facade: 'NOMADE’s stone facade and terrace tables',
    terrace: 'A high table and olive tree outside NOMADE’s window',
  },
  es: {
    house: 'Una mesa íntima, piedra iluminada y madera en la sala de NOMADE',
    wine: 'Una copa de vino junto al olivo y al ventanal abierto de NOMADE',
    dining: 'La sala de NOMADE con mesas de madera y lámparas de luz cálida',
    facade: 'La fachada de piedra de NOMADE y las mesas de la terraza',
    terrace: 'Una mesa alta y un olivo ante el ventanal de NOMADE',
  },
};

export default async function Home({ params }: { params: Promise<{ lang: string }> }){
  const { lang: rawLang } = await params;
  const lang = (['fr','en','es'] as const).includes(rawLang as 'fr'|'en'|'es') ? rawLang as 'fr'|'en'|'es' : 'fr';
  const t=copy[lang];
  const alt=photoAlt[lang];
  // TODO: Replace these layout placeholders with the restaurant-approved menu and prices before a production launch.
  const dishes=[['MAGRET DE CANARD','Jus réduit BBQ · patates douces · betteraves','21 €'],['RISOTTO','Pesto aux herbes · parmesan','18 €'],['PIÈCE DE BŒUF','Sélection du moment · cuisson au feu de bois','28 €']];
  return <main lang={lang}>
    <header className="header"><Link className="logo" href={`/${lang}#top`} aria-label="Nomade"><Image src="/nomade-logo-light.svg" alt="NOMADE" width={2933} height={1000} priority /></Link><nav>{t.nav.map((n,i)=><a key={n} href={['#house','#menu','#events','#contact'][i]}>{n}</a>)}</nav><div className="tools"><div className="langs">{(['fr','en','es'] as const).map(l=><Link key={l} className={lang===l?'active':''} href={`/${l}`}>{l.toUpperCase()}</Link>)}</div></div></header>
    <details className="mobileMenu">
      <summary aria-label="Menu"><span></span><span></span><span></span></summary>
      <div className="mobileNav">{t.nav.map((n,i)=><a key={n} href={['#house','#menu','#events','#contact'][i]}>{n}</a>)}<div className="langs mobileLangs">{(['fr','en','es'] as const).map(l=><Link key={l} className={lang===l?'active':''} href={`/${l}`}>{l.toUpperCase()}</Link>)}</div></div>
    </details>

    <section id="top" className="hero"><div className="heroMedia heroMediaEmpty" aria-hidden="true"/><div className="heroContent"><span>{t.heroKicker}</span><h1>NOMADE</h1><p className="heroTitle">{t.heroTitle}</p><p className="heroSub">{t.heroSub}</p><a className="button" href="#contact">{t.reserve}<ArrowUpRight size={16}/></a></div><a className="scroll" href="#house"><ArrowDown size={16}/>{t.discover}</a></section>

    <section id="house" className="split section printSection"><div className="houseCopy"><p className="eyebrow">01 / NOMADE</p><h2>{t.fire}</h2><p className="lead">{t.fireText}</p><a className="textLink" href="#menu">{t.signatures} <ArrowUpRight size={16}/></a></div><div className="venuePhoto housePhoto"><Image src="/images/nomade-interieur.webp" alt={alt.house} fill sizes="(max-width: 800px) 88vw, 42vw" /></div></section>

    <section className="local section printSection"><div className="venuePhoto winePhoto"><Image src="/images/nomade-vin.webp" alt={alt.wine} fill sizes="(max-width: 800px) 88vw, 46vw" /></div><div className="localCopy"><p className="eyebrow">02 / ARIÈGE</p><h2>{t.local}</h2><p className="lead">{t.localText}</p><a className="textLink" href="#menu">{t.menu} <ArrowUpRight size={16}/></a></div></section>

    <section id="menu" className="menuSection section"><div className="sectionHead"><div><p className="eyebrow">03 / LA CARTE</p><h2>{t.signatures}</h2></div><a className="button ghost" href="#contact">{t.menu}<ArrowUpRight size={16}/></a></div><div className="dishes">{dishes.map(([name,desc,price],i)=><article className="dish" key={name}><div className={`dishImage dish${i+1}`}/><div><h3>{name}</h3><p>{desc}</p></div><strong>{price}</strong></article>)}</div></section>

    {/* TODO: Validate this public-facing event copy with the restaurant before production publication. */}
    <section id="events" className="events section printSection"><div className="venuePhoto diningPhoto"><Image src="/images/nomade-salle.webp" alt={alt.dining} fill sizes="(max-width: 800px) 88vw, 46vw" /></div><div><p className="eyebrow">04 / NOMADE</p><h2>{t.events}</h2><p className="lead">Anniversaires, repas d’entreprise, événements privés — un cadre chaleureux et authentique.</p><a className="button" href="#contact">En savoir plus<ArrowUpRight size={16}/></a></div></section>

    <section id="contact" className="contact section printSection"><div><p className="eyebrow">05 / FOIX</p><h2>{t.find}</h2><p className="address">42 Rue des Chapeliers<br/>09000 Foix, France</p><p className="muted"><a href="tel:+33745262823">07 45 26 28 23</a><br/><a href="mailto:nomaderestaubar@gmail.com">nomaderestaubar@gmail.com</a></p><a className="button" href="mailto:nomaderestaubar@gmail.com">{t.reserve}<ArrowUpRight size={16}/></a></div><div className="exteriorPhotos"><div className="venuePhoto facadePhoto"><Image src="/images/nomade-facade.webp" alt={alt.facade} fill sizes="(max-width: 800px) 73vw, 32vw" /></div><div className="venuePhoto terracePhoto"><Image src="/images/nomade-terrasse.webp" alt={alt.terrace} fill sizes="(max-width: 800px) 40vw, 17vw" /></div></div></section>

    <footer><div className="logo"><Image src="/nomade-logo-light.svg" alt="NOMADE" width={2933} height={1000} /></div><div>Restaurant · Bar · Foix</div><Link href={`/${lang}/mentions-legales`}>Mentions légales</Link><Link href={`/${lang}/confidentialite`}>Confidentialité</Link><Link href={`/${lang}/allergenes`}>{t.allergens}</Link><a href="#top">{t.discover} <ArrowUpRight size={14}/></a><a href="https://www.instagram.com/nomaderestaubar/" target="_blank" rel="noopener noreferrer" aria-label="Instagram — @nomaderestaubar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a></footer>
  </main>
}

export function generateStaticParams() {
  return [{ lang: 'fr' }, { lang: 'en' }, { lang: 'es' }];
}
