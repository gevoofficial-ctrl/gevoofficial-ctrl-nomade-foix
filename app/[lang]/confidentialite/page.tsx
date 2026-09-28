import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const copy = {
  fr: { title: 'Politique de confidentialité', back: 'Retour au site', intro: 'Cette page est un modèle à compléter et à valider avant publication avec les traitements réellement mis en œuvre par NOMADE.', s1: 'Données collectées', s1p: 'À confirmer : les données réellement collectées, leurs sources et les éventuels destinataires.', s2: 'Finalités du traitement', s2p: 'À confirmer : les finalités, la base légale et les personnes ayant accès aux données.', s3: 'Durée de conservation', s3p: 'À confirmer : les durées de conservation appliquées à chaque catégorie de données.', s4: 'Cookies', s4p: 'À confirmer : les outils de mesure, services tiers et traceurs réellement utilisés sur le site.', s5: 'Vos droits', s5p: 'Les modalités d’exercice des droits doivent être complétées avec un contact vérifié avant publication.', s6: 'Réclamation', s6p: 'Les informations sur les recours applicables doivent être validées juridiquement avant publication.', contact: 'Contact', contactP: '[Coordonnées à confirmer]' },
  en: { title: 'Privacy policy', back: 'Back to site', intro: 'This page is a template that must be completed and legally reviewed before publication using NOMADE’s actual data-processing practices.', s1: 'Data we collect', s1p: 'To be confirmed: the data actually collected, its sources and any recipients.', s2: 'Purpose of processing', s2p: 'To be confirmed: the purposes, legal basis and people who can access the data.', s3: 'Retention period', s3p: 'To be confirmed: the retention period for each category of data.', s4: 'Cookies', s4p: 'To be confirmed: the analytics tools, third-party services and trackers actually used on the site.', s5: 'Your rights', s5p: 'The process for exercising data rights must be completed with a verified contact before publication.', s6: 'Complaints', s6p: 'The applicable complaint information must be legally reviewed before publication.', contact: 'Contact', contactP: '[Contact details to be confirmed]' },
  es: { title: 'Política de privacidad', back: 'Volver al sitio', intro: 'Esta página es una plantilla que debe completarse y validarse legalmente antes de publicarse con las prácticas reales de tratamiento de datos de NOMADE.', s1: 'Datos recopilados', s1p: 'Por confirmar: los datos realmente recopilados, sus fuentes y posibles destinatarios.', s2: 'Finalidad del tratamiento', s2p: 'Por confirmar: las finalidades, la base jurídica y las personas que pueden acceder a los datos.', s3: 'Plazo de conservación', s3p: 'Por confirmar: el plazo de conservación de cada categoría de datos.', s4: 'Cookies', s4p: 'Por confirmar: las herramientas de medición, los servicios de terceros y los rastreadores utilizados realmente en el sitio.', s5: 'Sus derechos', s5p: 'El proceso para ejercer los derechos debe completarse con un contacto verificado antes de la publicación.', s6: 'Reclamaciones', s6p: 'La información aplicable sobre reclamaciones debe validarse jurídicamente antes de la publicación.', contact: 'Contacto', contactP: '[Datos de contacto por confirmar]' },
};

export default async function Confidentialite({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = (['fr', 'en', 'es'] as const).includes(rawLang as 'fr' | 'en' | 'es') ? rawLang as 'fr' | 'en' | 'es' : 'fr';
  const t = copy[lang];

  return <main className="legalPage" lang={lang}><div className="legalHead"><p className="eyebrow">NOMADE</p><h1>{t.title}</h1><Link className="textLink" href={`/${lang}#top`}>{t.back} <ArrowUpRight size={16} /></Link></div>
    <p className="lead legalIntro">{t.intro}</p>
    <section className="legalSection"><h2>{t.s1}</h2><p>{t.s1p}</p></section><section className="legalSection"><h2>{t.s2}</h2><p>{t.s2p}</p></section><section className="legalSection"><h2>{t.s3}</h2><p>{t.s3p}</p></section><section className="legalSection"><h2>{t.s4}</h2><p>{t.s4p}</p></section><section className="legalSection"><h2>{t.s5}</h2><p>{t.s5p}</p></section><section className="legalSection"><h2>{t.s6}</h2><p>{t.s6p}</p></section><section className="legalSection"><h2>{t.contact}</h2><p>{t.contactP}</p></section>
  </main>;
}

export function generateStaticParams() {
  return [{ lang: 'fr' }, { lang: 'en' }, { lang: 'es' }];
}
