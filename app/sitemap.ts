import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.nomade-foix.fr';
const languages = {
  fr: `${siteUrl}/fr`,
  en: `${siteUrl}/en`,
  es: `${siteUrl}/es`,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedPages = [
    { path: '', priority: 1 },
    { path: '/carte', priority: 0.8 },
    { path: '/mentions-legales', priority: 0.2 },
    { path: '/confidentialite', priority: 0.2 },
    { path: '/allergenes', priority: 0.2 },
  ];

  return localizedPages.flatMap(({ path, priority }) =>
    (Object.keys(languages) as Array<keyof typeof languages>).map((lang) => ({
      url: `${languages[lang]}${path}`,
      changeFrequency: 'monthly' as const,
      priority,
      alternates: {
        languages: Object.fromEntries(
          (Object.keys(languages) as Array<keyof typeof languages>).map((alternateLang) => [
            alternateLang,
            `${languages[alternateLang]}${path}`,
          ]),
        ),
      },
    })),
  );
}
