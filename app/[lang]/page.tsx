import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import HeroVideo from '../components/hero-video';
import MobileMenu from '../components/mobile-menu';
import ReservationForm from '../components/reservation-form';
import { homePhotoSlots, type HomePhoto } from '../../lib/home-content';
import { publicHomeContent } from '../../lib/home-content-store';
import { localized, readMenu, sortedMenu, type Dish } from '../../lib/menu';

const homepageDishIds = [
  '00000000-0000-4000-8000-000000000014',
  '00000000-0000-4000-8000-000000000007',
];

const homepageDishMedia: Record<string, { src: string; alt: Record<'fr' | 'en' | 'es', string>; position: string }> = {
  '00000000-0000-4000-8000-000000000014': {
    src: '/images/ravioli.jpg',
    alt: {
      fr: 'Raviolis porc et bœuf servis dans leur sauce',
      en: 'Pork and beef ravioli served in their sauce',
      es: 'Raviolis de cerdo y ternera servidos en su salsa',
    },
    position: '50% 58%',
  },
  '00000000-0000-4000-8000-000000000007': {
    src: '/images/magret.jpg',
    alt: {
      fr: 'Magret de canard et légumes de saison',
      en: 'Duck breast with seasonal vegetables',
      es: 'Magret de pato con verduras de temporada',
    },
    position: '50% 56%',
  },
};

const navigation = {
  fr: { nav:['La maison','La carte','Privatisation','Contact'], lunch:'Déjeuner à emporter', seoH1:'Restaurant bistronomique et bar à Foix' },
  en: { nav:['The house','The menu','Private Events','Contact'], lunch:'Takeaway lunch', seoH1:'Bistronomic restaurant and bar in Foix' },
  es: { nav:['La casa','La carta','Eventos privados','Contacto'], lunch:'Almuerzo para llevar', seoH1:'Restaurante bistronómico y bar en Foix' },
};

const videoFallbackCopy = {
  fr: 'Votre navigateur ne prend pas en charge la vidéo.',
  en: 'Your browser does not support video playback.',
  es: 'Tu navegador no admite la reproducción de vídeo.',
};

export default async function Home({ params }: { params: Promise<{ lang: string }> }){
  const { lang: rawLang } = await params;
  const lang = (['fr','en','es'] as const).includes(rawLang as 'fr'|'en'|'es') ? rawLang as 'fr'|'en'|'es' : 'fr';
  const [content, menuItems] = await Promise.all([publicHomeContent(), readMenu()]);
  const t = { ...navigation[lang], ...content.texts[lang] };
  const alt = content.alt[lang];
  const photo = (slot: HomePhoto) => content.photos[slot] || homePhotoSlots[slot].original;
  const heroPhoto = photo('hero');
  const menu=sortedMenu(menuItems);
  const signatures=menu.filter(dish => dish.signature && dish.available).slice(0,2);
  const dishes=signatures.length > 0
    ? signatures
    : homepageDishIds.map(id => menu.find(d => d.id === id)).filter((dish): dish is Dish => Boolean(dish));
  const videoFallback=videoFallbackCopy[lang];
  const navLinks = ['#house', '#menu', '#events', '#contact'];
  return <main lang={lang}>
    {!heroPhoto && <link rel="preload" as="image" href="/video/nomade-hero-poster-v2.webp" fetchPriority="high" />}
    <header className="header"><Link className="logo" href={`/${lang}#top`} aria-label="Nomade"><Image src="/nomade-logo-light.svg" alt="NOMADE" width={2933} height={1000} priority /></Link><nav>{t.nav.map((n,i)=><a key={n} href={navLinks[i]}>{n}</a>)}<Link href={`/${lang}/dejeuner`}>{t.lunch}</Link></nav><div className="tools"><div className="langs">{(['fr','en','es'] as const).map(l=><Link key={l} className={lang===l?'active':''} href={`/${l}`}>{l.toUpperCase()}</Link>)}</div></div></header>
    <MobileMenu>
      <summary aria-label="Menu"><span></span><span></span><span></span></summary>
      <div className="mobileNav">{t.nav.map((n,i)=><a key={n} href={navLinks[i]} aria-label={n}>{n}</a>)}<Link href={`/${lang}/dejeuner`} aria-label={t.lunch}>{t.lunch}</Link><div className="langs mobileLangs">{(['fr','en','es'] as const).map(l=><Link key={l} className={lang===l?'active':''} href={`/${l}`} aria-label={l.toUpperCase()}>{l.toUpperCase()}</Link>)}</div></div>
    </MobileMenu>

    <section id="top" className="hero"><div className={heroPhoto ? "heroMedia heroMediaVideo heroMediaStill" : "heroMedia heroMediaVideo"}>{heroPhoto
        ? <Image className="heroStill" src={heroPhoto} alt="" fill sizes="100vw" preload />
        : <HeroVideo fallback={videoFallback} lang={lang} />}</div><div className="heroContent"><span>{t.heroKicker}</span><h1>NOMADE<span className="srOnly"> — {t.seoH1}</span></h1><p className="heroTitle">{t.heroTitle}</p><p className="heroSub">{t.heroSub}</p><a className="button" href="#reservation">{t.reserve}<ArrowUpRight size={16}/></a></div><a className="scroll" href="#house"><ArrowDown size={16}/>{t.discover}</a></section>

    <section id="house" className="split section printSection"><div className="houseCopy"><p className="eyebrow">01 / NOMADE</p><h2>{t.fire}</h2><p className="lead">{t.fireText}</p><a className="textLink" href="#menu">{t.signatures} <ArrowUpRight size={16}/></a></div><div className="venuePhoto housePhoto"><Image src={photo('house')} alt={alt.house} fill sizes="(max-width: 800px) 88vw, 42vw" /></div></section>

    <section className="local section printSection"><div className="venuePhoto winePhoto"><Image src={photo('wine')} alt={alt.wine} fill sizes="(max-width: 800px) 88vw, 46vw" /></div><div className="localCopy"><p className="eyebrow">02 / ARIÈGE</p><h2>{t.local}</h2><p className="lead">{t.localText}</p><Link className="textLink" href={`/${lang}/carte`}>{t.menu} <ArrowUpRight size={16}/></Link></div></section>

    <section id="menu" className="menuSection section"><div className="sectionHead"><div><p className="eyebrow">03 / {t.nav[1]}</p><h2>{t.signatures}</h2></div><Link className="button ghost" href={`/${lang}/carte`}>{t.menu}<ArrowUpRight size={16}/></Link></div><div className="dishes">{dishes.map(d => { const dish = localized(d, lang); const media = homepageDishMedia[d.id]; const imageSrc = d.imageUrl || media?.src; return <article className="dish" key={d.id}><div className={`dishImage${imageSrc?' dishImagePhoto':''}`}>{imageSrc && <Image src={imageSrc} alt={media?.alt[lang] || dish.name} fill sizes="(max-width: 800px) 88vw, 28vw" style={{ objectFit: 'cover', objectPosition: media?.position || '50% 50%' }} />}</div><div><h3>{dish.name}</h3><p>{dish.description}</p></div></article> })}<article className="dish dishPromo"><div className="dishImage dishImagePhoto"><Image src={photo('cocktails')} alt={alt.cocktails} fill sizes="(max-width: 800px) 88vw, 28vw" style={{ objectFit: 'cover', objectPosition: '50% 50%' }} /></div><div><h3>{t.cocktails}</h3></div></article></div>{dishes.length===0 && <p className="muted">{lang==='fr'?'La carte arrive bientôt.':lang==='en'?'The menu is coming soon.':'La carta estará disponible pronto.'}</p>}</section>

    {/* TODO: Validate this public-facing event copy with the restaurant before production publication. */}
    <section id="events" className="events section printSection"><div className="venuePhoto diningPhoto"><Image src={photo('dining')} alt={alt.dining} fill sizes="(max-width: 800px) 88vw, 46vw" /></div><div><p className="eyebrow">04 / NOMADE</p><h2>{t.events}</h2><p className="lead">{t.eventDescription}</p><a className="button" href="#contact">{t.eventLink}<ArrowUpRight size={16}/></a></div></section>

    <ReservationForm lang={lang} title={t.reservationTitle} intro={t.reservationIntro} />

    <section id="contact" className="contact section printSection"><div><p className="eyebrow">06 / FOIX</p><h2>{t.find}</h2><p className="address"><a href="https://www.google.com/maps/search/?api=1&query=NOMADE%2C%2042%20Rue%20des%20Chapeliers%2C%2009000%20Foix%2C%20France" target="_blank" rel="noopener noreferrer">42 Rue des Chapeliers<br/>09000 Foix, France</a></p><p className="muted"><a href="tel:+33745262823">07 45 26 28 23</a><br/><a href="mailto:nomaderestaubar@gmail.com">nomaderestaubar@gmail.com</a></p><a className="button" href="#reservation">{t.reserve}<ArrowUpRight size={16}/></a></div><div className="exteriorPhotos"><div className="venuePhoto facadePhoto"><Image src={photo('facade')} alt={alt.facade} fill sizes="(max-width: 800px) 73vw, 32vw" /></div><div className="venuePhoto terracePhoto"><Image src={photo('terrace')} alt={alt.terrace} fill sizes="(max-width: 800px) 40vw, 17vw" /></div></div></section>

  </main>
}

export function generateStaticParams() {
  return [{ lang: 'fr' }, { lang: 'en' }, { lang: 'es' }];
}
export const dynamic = 'force-dynamic';
