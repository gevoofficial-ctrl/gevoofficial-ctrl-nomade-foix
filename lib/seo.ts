import type { Metadata } from 'next';

export const siteUrl = 'https://www.nomade-foix.fr';
export const languages = ['fr', 'en', 'es'] as const;
export type SiteLanguage = typeof languages[number];

const locales: Record<SiteLanguage, string> = {
  fr: 'fr_FR',
  en: 'en_GB',
  es: 'es_ES',
};

export function isSiteLanguage(value: string): value is SiteLanguage {
  return (languages as readonly string[]).includes(value);
}

export function pageMetadata(
  lang: SiteLanguage,
  path: string,
  title: string,
  description: string,
): Metadata {
  const localizedPath = `/${lang}${path}`;
  const alternates = Object.fromEntries(
    languages.map((language) => [language, `/${language}${path}`]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: localizedPath,
      languages: { ...alternates, 'x-default': `/fr${path}` },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      url: localizedPath,
      siteName: 'NOMADE',
      locale: locales[lang],
      alternateLocale: languages.filter((language) => language !== lang).map((language) => locales[language]),
      title,
      description,
      images: [{ url: '/video/nomade-hero-poster.jpg', width: 1600, height: 899, alt: 'NOMADE — Restaurant · Bar · Foix' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/video/nomade-hero-poster.jpg'],
    },
  };
}
