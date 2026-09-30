import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { isSiteLanguage, pageMetadata } from '../../../lib/seo';

const allergens = {
  fr: [
    ['Céréales contenant du gluten','Blé, seigle, orge, avoine, épeautre, kamut et produits dérivés.'],
    ['Crustacés','Crustacés et produits à base de crustacés.'],
    ['Œufs','Œufs et produits à base d’œufs.'],
    ['Poissons','Poissons et produits à base de poissons.'],
    ['Arachides','Arachides et produits à base d’arachides.'],
    ['Soja','Soja et produits à base de soja.'],
    ['Lait','Lait et produits à base de lait, y compris le lactose.'],
    ['Fruits à coque','Amandes, noisettes, noix, noix de cajou, noix de pécan, noix du Brésil, pistaches et noix de macadamia.'],
    ['Céleri','Céleri et produits à base de céleri.'],
    ['Moutarde','Moutarde et produits à base de moutarde.'],
    ['Graines de sésame','Sésame et produits à base de sésame.'],
    ['Anhydride sulfureux et sulfites','À des concentrations supérieures à 10 mg/kg ou 10 mg/l.'],
    ['Lupin','Lupin et produits à base de lupin.'],
    ['Mollusques','Mollusques et produits à base de mollusques.']
  ],
  en: [
    ['Cereals containing gluten','Wheat, rye, barley, oats, spelt, kamut and products thereof.'],['Crustaceans','Crustaceans and products thereof.'],['Eggs','Eggs and products thereof.'],['Fish','Fish and products thereof.'],['Peanuts','Peanuts and products thereof.'],['Soybeans','Soybeans and products thereof.'],['Milk','Milk and products thereof, including lactose.'],['Tree nuts','Almonds, hazelnuts, walnuts, cashews, pecans, Brazil nuts, pistachios and macadamia nuts.'],['Celery','Celery and products thereof.'],['Mustard','Mustard and products thereof.'],['Sesame seeds','Sesame seeds and products thereof.'],['Sulphur dioxide and sulphites','At concentrations above 10 mg/kg or 10 mg/l.'],['Lupin','Lupin and products thereof.'],['Molluscs','Molluscs and products thereof.']
  ],
  es: [
    ['Cereales con gluten','Trigo, centeno, cebada, avena, espelta, kamut y productos derivados.'],['Crustáceos','Crustáceos y productos a base de crustáceos.'],['Huevos','Huevos y productos a base de huevo.'],['Pescado','Pescado y productos a base de pescado.'],['Cacahuetes','Cacahuetes y productos a base de cacahuete.'],['Soja','Soja y productos a base de soja.'],['Leche','Leche y productos lácteos, incluida la lactosa.'],['Frutos de cáscara','Almendras, avellanas, nueces, anacardos, pacanas, nueces de Brasil, pistachos y macadamias.'],['Apio','Apio y productos derivados.'],['Mostaza','Mostaza y productos derivados.'],['Sésamo','Semillas de sésamo y productos derivados.'],['Dióxido de azufre y sulfitos','En concentraciones superiores a 10 mg/kg o 10 mg/l.'],['Altramuces','Altramuces y productos derivados.'],['Moluscos','Moluscos y productos derivados.']
  ]
};

const copy = {
  fr:{title:'Allergènes',description:'Informations sur les allergènes chez NOMADE, restaurant à Foix.',intro:'Information sur les allergènes',text:'Conformément à la réglementation européenne, voici les 14 catégories d’allergènes faisant l’objet d’une déclaration obligatoire.',notice:'Vous avez une allergie ou une intolérance ?',noticeText:'Merci d’en informer notre équipe avant de commander. La composition des plats peut évoluer et, malgré toutes les précautions prises en cuisine, un contact croisé avec d’autres allergènes ne peut pas être totalement exclu.',dishTitle:'Allergènes dans nos plats',dishText:'La liste détaillée des allergènes présents dans chaque plat sera publiée ici après validation de la composition par l’équipe NOMADE.',back:'Retour au site'},
  en:{title:'Allergens',description:'Allergen information for NOMADE, restaurant in Foix.',intro:'Allergen information',text:'In accordance with European regulations, these are the 14 categories of allergens subject to mandatory declaration.',notice:'Do you have an allergy or intolerance?',noticeText:'Please inform our team before ordering. Dish composition may change and, despite precautions in the kitchen, cross-contact with other allergens cannot be completely excluded.',dishTitle:'Allergens in our dishes',dishText:'The detailed list of allergens present in each dish will be published here once the composition has been validated by the NOMADE team.',back:'Back to site'},
  es:{title:'Alérgenos',description:'Información sobre alérgenos en NOMADE, restaurante en Foix.',intro:'Información sobre alérgenos',text:'De acuerdo con la normativa europea, estas son las 14 categorías de alérgenos de declaración obligatoria.',notice:'¿Tienes alguna alergia o intolerancia?',noticeText:'Informa a nuestro equipo antes de pedir. La composición de los platos puede cambiar y, a pesar de las precauciones en cocina, no se puede excluir por completo el contacto cruzado con otros alérgenos.',dishTitle:'Alérgenos en nuestros platos',dishText:'La lista detallada de alérgenos presentes en cada plato se publicará aquí una vez que el equipo de NOMADE haya validado su composición.',back:'Volver al sitio'}
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!isSiteLanguage(rawLang)) return {};
  const t = copy[rawLang];
  return pageMetadata(rawLang, '/allergenes', `${t.title} | NOMADE — Foix`, t.description);
}

export default async function Allergenes({params}:{params:Promise<{lang:string}>}){
  const {lang:rawLang}=await params;
  const lang=(['fr','en','es'] as const).includes(rawLang as 'fr'|'en'|'es') ? rawLang as 'fr'|'en'|'es' : 'fr';
  const t=copy[lang];
  return <main className="legalPage">
    <div className="legalHead"><p className="eyebrow">NOMADE · FOIX</p><h1>{t.title}</h1><p className="lead">{t.text}</p><Link className="textLink" href={`/${lang}#top`}>{t.back} <ArrowUpRight size={16}/></Link></div>
    <section className="legalSection"><p className="eyebrow">{t.intro}</p><div className="legalList">{allergens[lang].map(([name,description],i)=><div key={name} style={{padding:'18px 0',borderBottom:'1px solid rgba(255,255,255,.15)'}}><strong>{String(i+1).padStart(2,'0')} · {name}</strong><p>{description}</p></div>)}</div></section>
    <section className="legalSection"><h2>{t.dishTitle}</h2><p>{t.dishText}</p></section>
    <section className="legalSection"><h2>{t.notice}</h2><p>{t.noticeText}</p></section>
  </main>;
}
export function generateStaticParams(){return [{lang:'fr'},{lang:'en'},{lang:'es'}];}
