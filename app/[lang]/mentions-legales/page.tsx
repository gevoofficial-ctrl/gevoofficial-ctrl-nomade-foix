import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

// Restaurant legal details validated by NOMADE. Hosting details remain pending confirmation.
const legal = {
  companyName: 'SAS NOMADE',
  legalForm: 'SAS',
  capital: '1 000 €',
  address: '42 Rue des Chapeliers, 09000 Foix, France',
  rcs: '943 332 155 00010',
  vat: 'FR40 943 332 155',
  publisherName: 'CHLOIAN KAMO',
  phone: '07 45 26 28 23',
  email: 'nomaderestaubar@gmail.com',
  hostName: '[Nom de l’hébergeur — ex. Vercel Inc.]',
  hostAddress: '[Adresse de l’hébergeur]',
  hostPhone: '[Téléphone de l’hébergeur, si disponible]'
};

const copy = {
  fr: { title:'Mentions légales', back:'Retour au site', s1:'Éditeur du site', s2:'Hébergement', s3:'Propriété intellectuelle', s4:'Responsabilité', s5:'Droit applicable et litiges', editorIntro:'Le présent site est édité par :', hostIntro:'Le site est hébergé par :', ip:'L’ensemble des contenus présents sur ce site (textes, images, logo, charte graphique) est la propriété exclusive de NOMADE, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.', liability:'NOMADE s’efforce d’assurer l’exactitude des informations diffusées sur ce site, mais ne saurait être tenu responsable des erreurs, omissions ou de l’indisponibilité temporaire du site.', law:'Le présent site est soumis au droit français. En cas de litige, et à défaut d’accord amiable, les tribunaux français seront seuls compétents.', field:{name:'Dénomination',form:'Forme juridique',capital:'Capital social',address:'Adresse',id:'SIRET / RCS',vat:'TVA intracommunautaire',publisher:'Directeur de la publication',contact:'Contact'} },
  en: { title:'Legal notice', back:'Back to site', s1:'Website publisher', s2:'Hosting', s3:'Intellectual property', s4:'Liability', s5:'Governing law', editorIntro:'This website is published by:', hostIntro:'This website is hosted by:', ip:'All content on this site (text, images, logo, visual identity) is the exclusive property of NOMADE, unless stated otherwise. Any reproduction without prior authorisation is prohibited.', liability:'NOMADE strives to ensure the accuracy of the information on this site but cannot be held liable for errors, omissions, or temporary unavailability of the site.', law:'This site is governed by French law. In the event of a dispute, and failing an amicable agreement, French courts shall have sole jurisdiction.', field:{name:'Company name',form:'Legal form',capital:'Share capital',address:'Address',id:'Registration number',vat:'VAT number',publisher:'Publication director',contact:'Contact'} },
  es: { title:'Aviso legal', back:'Volver al sitio', s1:'Editor del sitio', s2:'Alojamiento', s3:'Propiedad intelectual', s4:'Responsabilidad', s5:'Ley aplicable', editorIntro:'Este sitio web está editado por:', hostIntro:'Este sitio está alojado por:', ip:'Todo el contenido de este sitio (textos, imágenes, logotipo, identidad visual) es propiedad exclusiva de NOMADE, salvo indicación contraria. Queda prohibida su reproducción sin autorización previa.', liability:'NOMADE se esfuerza por garantizar la exactitud de la información publicada en este sitio, pero no puede ser responsable de errores, omisiones o indisponibilidad temporal del sitio.', law:'Este sitio se rige por la legislación francesa. En caso de litigio, y a falta de acuerdo amistoso, los tribunales franceses serán los únicos competentes.', field:{name:'Denominación',form:'Forma jurídica',capital:'Capital social',address:'Dirección',id:'Número de registro',vat:'NIF intracomunitario',publisher:'Director de publicación',contact:'Contacto'} }
};

export default async function MentionsLegales({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = (['fr','en','es'] as const).includes(rawLang as 'fr'|'en'|'es') ? rawLang as 'fr'|'en'|'es' : 'fr';
  const t=copy[lang];
  return <main className="legalPage">
    <div className="legalHead"><p className="eyebrow">NOMADE</p><h1>{t.title}</h1><Link className="textLink" href={`/${lang}#top`}>{t.back} <ArrowUpRight size={16}/></Link></div>
    <section className="legalSection"><h2>{t.s1}</h2><p>{t.editorIntro}</p><ul className="legalList">
      <li><strong>{t.field.name} : </strong>{legal.companyName}</li><li><strong>{t.field.form} : </strong>{legal.legalForm}</li><li><strong>{t.field.capital} : </strong>{legal.capital}</li><li><strong>{t.field.address} : </strong>{legal.address}</li><li><strong>{t.field.id} : </strong>{legal.rcs}</li><li><strong>{t.field.vat} : </strong>{legal.vat}</li><li><strong>{t.field.publisher} : </strong>{legal.publisherName}</li><li><strong>{t.field.contact} : </strong>{legal.phone} · {legal.email}</li>
    </ul></section>
    <section className="legalSection"><h2>{t.s2}</h2><p>{t.hostIntro}</p><ul className="legalList"><li>{legal.hostName}</li><li>{legal.hostAddress}</li><li>{legal.hostPhone}</li></ul></section>
    <section className="legalSection"><h2>{t.s3}</h2><p>{t.ip}</p></section>
    <section className="legalSection"><h2>{t.s4}</h2><p>{t.liability}</p></section>
    <section className="legalSection"><h2>{t.s5}</h2><p>{t.law}</p></section>
  </main>;
}
export function generateStaticParams(){ return [{lang:'fr'},{lang:'en'},{lang:'es'}]; }
