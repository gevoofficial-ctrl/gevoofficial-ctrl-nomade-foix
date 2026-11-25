const copy = {
  fr: {
    reservationTitle: 'Votre table chez NOMADE',
    reservationIntro: 'Réservez votre table. Une confirmation vous sera adressée par e-mail.',
    cocktails: 'COCKTAILS',
    heroKicker: 'Restaurant · Bar · Foix',
    heroTitle: 'Cuisine au feu.',
    heroSub: 'Produits locaux · Influences du monde',
    reserve: 'Réserver une table',
    discover: 'Découvrir',
    fire: 'Le feu est notre point de départ.',
    fireText: "Une cuisine libre, généreuse et instinctive. Des produits d’ici, des inspirations d’ailleurs. Nomade, c’est un voyage au cœur de l’Ariège.",
    local: 'D’ici. D’ailleurs.',
    localText: 'Nous travaillons avec des producteurs locaux et des saveurs du monde pour créer une cuisine sincère, vivante et sans frontières.',
    signatures: 'Nos signatures',
    menu: 'Voir la carte complète',
    events: 'Événements & privatisation',
    find: 'Nous trouver',
  },
  en: {
    reservationTitle: 'Your table at NOMADE',
    reservationIntro: 'Book your table. A confirmation will be sent to you by email.',
    cocktails: 'COCKTAILS',
    heroKicker: 'Restaurant · Bar · Foix',
    heroTitle: 'Cooking with fire.',
    heroSub: 'Local produce · Global influences',
    reserve: 'Book a table',
    discover: 'Discover',
    fire: 'Fire is where we begin.',
    fireText: 'A free, generous and instinctive cuisine. Local produce, influences from elsewhere. Nomade is a journey through Ariège.',
    local: 'From here. From elsewhere.',
    localText: 'Local producers and flavours from around the world meet in a sincere, lively cuisine without borders.',
    signatures: 'Our signatures',
    menu: 'View full menu',
    events: 'Events & private dining',
    find: 'Find us',
  },
  es: {
    reservationTitle: 'Tu mesa en NOMADE',
    reservationIntro: 'Reserva tu mesa. Recibirás una confirmación por correo electrónico.',
    cocktails: 'CÓCTELES',
    heroKicker: 'Restaurante · Bar · Foix',
    heroTitle: 'Cocina al fuego.',
    heroSub: 'Productos locales · Influencias del mundo',
    reserve: 'Reservar una mesa',
    discover: 'Descubrir',
    fire: 'El fuego es nuestro punto de partida.',
    fireText: 'Una cocina libre, generosa e instintiva. Productos locales e influencias de otros lugares. Nomade es un viaje por Ariège.',
    local: 'De aquí. De allá.',
    localText: 'Productores locales y sabores del mundo se encuentran en una cocina sincera, viva y sin fronteras.',
    signatures: 'Nuestros platos',
    menu: 'Ver la carta completa',
    events: 'Eventos y espacios privados',
    find: 'Dónde estamos',
  }
};

const photoAlt = {
  fr: {
    cocktails: 'Trois cocktails colorés servis sur une table en marbre',
    house: 'Table intime, pierre éclairée et bois dans la salle de NOMADE',
    wine: 'Verre de vin sur une table près de l’olivier et de la baie ouverte de NOMADE',
    dining: 'Salle de NOMADE, tables en bois et luminaires dans une lumière chaleureuse',
    facade: 'Façade en pierre de NOMADE et tables de la terrasse',
    terrace: 'Table haute et olivier devant la baie vitrée de NOMADE',
  },
  en: {
    cocktails: 'Three colourful cocktails served on a marble table',
    house: 'An intimate table, illuminated stone and wood inside NOMADE',
    wine: 'A glass of wine beside an olive tree and the open window at NOMADE',
    dining: 'The NOMADE dining room with wooden tables and warm pendant lighting',
    facade: 'NOMADE’s stone facade and terrace tables',
    terrace: 'A high table and olive tree outside NOMADE’s window',
  },
  es: {
    cocktails: 'Tres cócteles de colores servidos en una mesa de mármol',
    house: 'Una mesa íntima, piedra iluminada y madera en la sala de NOMADE',
    wine: 'Una copa de vino junto al olivo y al ventanal abierto de NOMADE',
    dining: 'La sala de NOMADE con mesas de madera y lámparas de luz cálida',
    facade: 'La fachada de piedra de NOMADE y las mesas de la terraza',
    terrace: 'Una mesa alta y un olivo ante el ventanal de NOMADE',
  },
};

const eventCopy = {
  fr: { description: 'Anniversaires, repas d’entreprise, événements privés — un cadre chaleureux et authentique.', cta: 'En savoir plus' },
  en: { description: 'Birthdays, business meals and private events — a warm, authentic setting.', cta: 'Learn more' },
  es: { description: 'Cumpleaños, comidas de empresa y eventos privados: un entorno cálido y auténtico.', cta: 'Más información' },
};

export const homeLanguages = ['fr', 'en', 'es'] as const;
export type HomeLanguage = typeof homeLanguages[number];

export const homePhotoSlots = {
  hero: { label: 'Premier écran', original: '' },
  house: { label: 'La maison', original: '/images/nomade-interieur.webp' },
  wine: { label: 'Produits et terroir', original: '/images/nomade-vin.webp' },
  cocktails: { label: 'Cocktails', original: '/images/cocktails.jpg' },
  dining: { label: 'Événements', original: '/images/nomade-salle.webp' },
  facade: { label: 'Façade', original: '/images/nomade-facade.webp' },
  terrace: { label: 'Terrasse', original: '/images/nomade-terrasse.webp' },
} as const;

export type HomePhoto = keyof typeof homePhotoSlots;

export const homeTextSections = [
  { title: 'Premier écran', fields: [
    { key: 'heroKicker', label: 'Surtitre', max: 80 },
    { key: 'heroTitle', label: 'Accroche', max: 80 },
    { key: 'heroSub', label: 'Sous-titre', max: 100 },
    { key: 'discover', label: 'Lien de découverte', max: 36 },
  ] },
  { title: 'La maison et le terroir', fields: [
    { key: 'fire', label: 'Titre de la maison', max: 100 },
    { key: 'fireText', label: 'Présentation de la maison', max: 600 },
    { key: 'local', label: 'Titre du terroir', max: 100 },
    { key: 'localText', label: 'Présentation du terroir', max: 600 },
  ] },
  { title: 'La carte', fields: [
    { key: 'signatures', label: 'Titre des signatures', max: 70 },
    { key: 'menu', label: 'Lien vers la carte', max: 48 },
    { key: 'cocktails', label: 'Titre de la carte cocktails', max: 48 },
  ] },
  { title: 'Événements', fields: [
    { key: 'events', label: 'Titre', max: 100 },
    { key: 'eventDescription', label: 'Présentation', max: 600 },
    { key: 'eventLink', label: 'Lien vers le contact', max: 48 },
  ] },
  { title: 'Réservation et contact', fields: [
    { key: 'reservationTitle', label: 'Titre de la réservation', max: 100 },
    { key: 'reservationIntro', label: 'Introduction de la réservation', max: 300 },
    { key: 'reserve', label: 'Bouton de réservation', max: 48 },
    { key: 'find', label: 'Titre du contact', max: 70 },
  ] },
] as const;

type HomeTextKey = typeof homeTextSections[number]['fields'][number]['key'];
type HomePhotoAlt = Exclude<HomePhoto, 'hero'>;
export type HomeContent = {
  texts: Record<HomeLanguage, Record<HomeTextKey, string>>;
  photos: Record<HomePhoto, string>;
  alt: Record<HomeLanguage, Record<HomePhotoAlt, string>>;
};

export const homePhotos = Object.keys(homePhotoSlots) as HomePhoto[];
export const homePhotoAlts = homePhotos.filter((key): key is HomePhotoAlt => key !== 'hero');

export function defaultHomeContent(): HomeContent {
  const texts = {} as HomeContent['texts'];
  for (const lang of homeLanguages) {
    const source = {
      ...copy[lang],
      eventDescription: eventCopy[lang].description,
      eventLink: eventCopy[lang].cta,
    };
    texts[lang] = Object.fromEntries(homeTextSections.flatMap(section =>
      section.fields.map(({ key }) => [key, source[key]]),
    )) as HomeContent['texts'][HomeLanguage];
  }
  return {
    texts,
    photos: { hero: '', house: '', wine: '', cocktails: '', dining: '', facade: '', terrace: '' },
    alt: structuredClone(photoAlt),
  };
}
