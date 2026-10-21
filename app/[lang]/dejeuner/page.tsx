import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getImageProps } from 'next/image';
import { readMenu, sortedMenu } from '../../../lib/menu';
import { lunchAvailable, lunchImageSizes, lunchKind } from '../../../lib/lunch';
import { isSiteLanguage, pageMetadata } from '../../../lib/seo';
import DejeunerForm from '../../components/dejeuner-form';

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
  // Hint the same responsive image that the live menu will render. A failed
  // read must not prevent the client loading/error/retry screen from opening.
  let imageUrl='';
  try {imageUrl=sortedMenu(await readMenu()).find(dish=>lunchAvailable(dish)&&lunchKind(dish)==='main')?.imageUrl||'';}catch{}
  const image=imageUrl?getImageProps({src:imageUrl,alt:'',fill:true,sizes:lunchImageSizes}).props:null;
  return <>
    {image&&<link rel="preload" as="image" imageSrcSet={image.srcSet} imageSizes={image.sizes} fetchPriority="high"/>}
    <DejeunerForm lang={lang}/>
  </>;
}
