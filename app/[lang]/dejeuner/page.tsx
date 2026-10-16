import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isSiteLanguage, pageMetadata } from '../../../lib/seo';
import DejeunerForm from '../../components/dejeuner-form';

const meta = {
  fr:{ title:'Déjeuner à partager | NOMADE — Foix', description:'Composez votre déjeuner à partager chez NOMADE, avec retrait à Foix et paiement sur place.' },
  en:{ title:'Lunch to share | NOMADE — Foix', description:'Build your NOMADE takeaway lunch in Foix, with pickup and payment on site.' },
  es:{ title:'Almuerzo para compartir | NOMADE — Foix', description:'Compón tu almuerzo para llevar en NOMADE, con recogida y pago en el local.' },
};
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{ const {lang}=await params; if(!isSiteLanguage(lang)) notFound(); return pageMetadata(lang,'/dejeuner',meta[lang].title,meta[lang].description); }
export default async function DejeunerPage({params}:{params:Promise<{lang:string}>}){ const {lang}=await params; if(!isSiteLanguage(lang)) notFound(); return <DejeunerForm lang={lang}/>; }
