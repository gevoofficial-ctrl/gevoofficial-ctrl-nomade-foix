import type { Metadata } from 'next';
import { createHash } from 'node:crypto';
import { notFound } from 'next/navigation';
import { isSiteLanguage, pageMetadata } from '../../../lib/seo';
import { readMenu } from '../../../lib/menu';
import { lunchCatalog, type LunchCatalog } from '../../../lib/lunch-catalog';
import DejeunerForm from '../../components/dejeuner-form';
import { lunchHeadlineCss } from '../../../lib/lunch-headline-font';

const meta = {
  fr:{ title:'Déjeuner à emporter | NOMADE — Foix', description:'Composez votre déjeuner à emporter chez NOMADE, avec retrait à Foix et paiement sur place.' },
  en:{ title:'Takeaway lunch | NOMADE — Foix', description:'Build your NOMADE takeaway lunch in Foix, with pickup and payment on site.' },
  es:{ title:'Almuerzo para llevar | NOMADE — Foix', description:'Compón tu almuerzo para llevar en NOMADE, con recogida y pago en el local.' },
};
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{ const {lang}=await params; if(!isSiteLanguage(lang)) notFound(); return pageMetadata(lang,'/dejeuner',meta[lang].title,meta[lang].description); }
export default async function DejeunerPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params;
  if(!isSiteLanguage(lang))notFound();
  let catalog:LunchCatalog|null=null;
  try {catalog=lunchCatalog(await readMenu(),lang);}catch{/* Keep the client error/retry fallback available. */}
  const version=createHash('sha256').update(JSON.stringify(catalog)).digest('hex').slice(0,12);
  return <><style>{lunchHeadlineCss}</style><DejeunerForm key={`${lang}:${version}`} lang={lang} initialMenu={catalog}/></>;
}
