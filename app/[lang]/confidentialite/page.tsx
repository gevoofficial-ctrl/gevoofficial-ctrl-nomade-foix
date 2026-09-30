import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { isSiteLanguage, pageMetadata } from '../../../lib/seo';

const restaurant = {
  name: 'SAS NOMADE',
  address: '42 Rue des Chapeliers, 09000 Foix, France',
  contact: 'nomaderestaubar@gmail.com · 07 45 26 28 23',
};

const copy = {
  fr: { title:'Politique de confidentialité', description:'Politique de confidentialité des demandes de réservation de NOMADE à Foix.', back:'Retour au site', intro:'NOMADE traite les données personnelles nécessaires à la gestion des demandes de réservation et de contact, conformément au Règlement Général sur la Protection des Données (RGPD).', s1:'Responsable du traitement',s1p:`Le responsable du traitement est ${restaurant.name}, ${restaurant.address}.`,s2:'Données collectées et finalités',s2p:'Le formulaire de réservation transmet votre nom, numéro de téléphone, date, heure et nombre de personnes. Ces données servent uniquement à répondre à votre demande et à confirmer, le cas échéant, la disponibilité.',s3:'Transmission et conservation',s3p:'Le site ne constitue pas de base de données de réservations : la demande est transmise à la boîte e-mail du restaurant par le service de messagerie configuré. Le restaurant conserve ensuite ces échanges pendant la durée nécessaire au traitement de la demande et au respect de ses obligations légales.',s4:'Cookies et préférences',s4p:'Aucun cookie publicitaire ou de mesure d’audience n’est actuellement activé. Le site mémorise seulement votre choix de consentement dans le stockage local de votre navigateur. Vous pouvez accepter, refuser ou modifier ce choix à tout moment avec le lien « Gérer les cookies » situé dans le pied de page.',s5:'Vos droits',s5p:'Vous disposez notamment d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données. Pour exercer ces droits, contactez le restaurant aux coordonnées ci-dessous.',s6:'Réclamation',s6p:'Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectés.',contact:'Contact'},
  en: { title:'Privacy policy', description:'Privacy policy for booking requests at NOMADE in Foix.', back:'Back to site', intro:'NOMADE processes the personal data needed to manage booking and contact requests in accordance with the General Data Protection Regulation (GDPR).', s1:'Data controller',s1p:`The data controller is ${restaurant.name}, ${restaurant.address}.`,s2:'Data collected and purpose',s2p:'The booking form sends your name, phone number, date, time and number of guests. This information is used only to respond to your request and, where applicable, confirm availability.',s3:'Transfer and retention',s3p:'The website does not maintain a booking database: the request is delivered to the restaurant mailbox through the configured email service. The restaurant then keeps these exchanges for as long as necessary to handle the request and meet its legal obligations.',s4:'Cookies and preferences',s4p:'No advertising or audience-measurement cookies are currently enabled. The site only stores your consent choice in your browser’s local storage. You can accept, refuse or change this choice at any time using the “Manage cookies” link in the footer.',s5:'Your rights',s5p:'You have the right to access, rectify, erase, restrict or object to processing of your data, and to data portability. To exercise these rights, contact the restaurant using the details below.',s6:'Complaints',s6p:'You may also lodge a complaint with the CNIL (www.cnil.fr) if you believe your rights are not being respected.',contact:'Contact'},
  es: { title:'Política de privacidad', description:'Política de privacidad de las solicitudes de reserva de NOMADE en Foix.', back:'Volver al sitio', intro:'NOMADE trata los datos personales necesarios para gestionar las solicitudes de reserva y contacto de conformidad con el Reglamento General de Protección de Datos (RGPD).', s1:'Responsable del tratamiento',s1p:`El responsable del tratamiento es ${restaurant.name}, ${restaurant.address}.`,s2:'Datos recopilados y finalidad',s2p:'El formulario de reserva envía su nombre, teléfono, fecha, hora y número de personas. Esta información se utiliza únicamente para responder a su solicitud y, cuando corresponda, confirmar la disponibilidad.',s3:'Transmisión y conservación',s3p:'El sitio web no mantiene una base de datos de reservas: la solicitud se envía al buzón del restaurante mediante el servicio de correo configurado. El restaurante conserva después estos intercambios durante el tiempo necesario para tramitar la solicitud y cumplir sus obligaciones legales.',s4:'Cookies y preferencias',s4p:'Actualmente no hay cookies publicitarias ni de medición de audiencia activadas. El sitio solo guarda su elección de consentimiento en el almacenamiento local del navegador. Puede aceptar, rechazar o modificar esta elección en cualquier momento con el enlace « Gestionar cookies » situado en el pie de página.',s5:'Sus derechos',s5p:'Usted tiene derecho de acceso, rectificación, supresión, limitación u oposición al tratamiento de sus datos, así como a la portabilidad. Para ejercer estos derechos, contacte con el restaurante mediante los datos indicados a continuación.',s6:'Reclamaciones',s6p:'También puede presentar una reclamación ante la CNIL (www.cnil.fr) si considera que no se respetan sus derechos.',contact:'Contacto'}
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!isSiteLanguage(rawLang)) return {};
  const t = copy[rawLang];
  return pageMetadata(rawLang, '/confidentialite', `${t.title} | NOMADE — Foix`, t.description);
}

export default async function Confidentialite({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = (['fr', 'en', 'es'] as const).includes(rawLang as 'fr' | 'en' | 'es') ? rawLang as 'fr' | 'en' | 'es' : 'fr';
  const t = copy[lang];

  return <main className="legalPage" lang={lang}><div className="legalHead"><p className="eyebrow">NOMADE</p><h1>{t.title}</h1><Link className="textLink" href={`/${lang}#top`}>{t.back} <ArrowUpRight size={16} /></Link></div>
    <p className="lead legalIntro">{t.intro}</p>
    <section className="legalSection"><h2>{t.s1}</h2><p>{t.s1p}</p></section><section className="legalSection"><h2>{t.s2}</h2><p>{t.s2p}</p></section><section className="legalSection"><h2>{t.s3}</h2><p>{t.s3p}</p></section><section className="legalSection"><h2>{t.s4}</h2><p>{t.s4p}</p></section><section className="legalSection"><h2>{t.s5}</h2><p>{t.s5p}</p></section><section className="legalSection"><h2>{t.s6}</h2><p>{t.s6p}</p></section><section className="legalSection"><h2>{t.contact}</h2><p>{restaurant.contact}</p></section>
  </main>;
}

export function generateStaticParams() {
  return [{ lang: 'fr' }, { lang: 'en' }, { lang: 'es' }];
}
