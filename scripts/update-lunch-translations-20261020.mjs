import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import path from 'node:path';

const root=process.argv[2];
if (!root || !path.isAbsolute(root)) throw new Error('An absolute application directory is required');
process.chdir(root);
const {readMenu,updateMenu,validateDish}=await import(pathToFileURL(path.join(root,'lib/menu.ts')));
const records=[
  {id:'11111111-1111-4111-8111-000000000001',hash:'3669e439849631669279d8ad63de4ad6f5452a21a9217269224b3a5f2352c61d',
    en:{name:'POULTRY',description:'Chicken leg\nConfit chicken leg marinated in smoked paprika, sweet potato purée with brown butter, reduced jus and herb salad.\nAllergens: milk (butter), soy. May contain traces of gluten.',ingredients:''},
    es:{name:'AVE',description:'Muslo de pollo\nMuslo de pollo confitado y marinado con pimentón ahumado, puré de boniato con mantequilla avellanada, jugo reducido y ensalada de hierbas.\nAlérgenos: leche (mantequilla), soja. Puede contener trazas de gluten.',ingredients:''}},
  {id:'11111111-1111-4111-8111-000000000002',hash:'127fef07eb8e7a5c82450052ad599a41c826bcfcfd428eb0aa1ea1f6da5ecc78',
    en:{name:'FISH',description:'Salmon\nBasmati rice, barbecued vegetables, herb salad and miso beurre blanc sauce.\nAllergens: fish (salmon), milk (butter), soy (miso).',ingredients:''},
    es:{name:'PESCADO',description:'Salmón\nArroz basmati, verduras a la barbacoa, ensalada de hierbas y salsa de mantequilla blanca con miso.\nAlérgenos: pescado (salmón), leche (mantequilla), soja (miso).',ingredients:''}},
  {id:'11111111-1111-4111-8111-000000000003',hash:'ce77bed4c522a8312feaf4f65d01473f752c9d06bbede559baee408c297a0560',
    en:{name:'VEGETARIAN',description:'Cauliflower\nSlow-cooked, spice-smoked carrots and squash, coconut vegetable curry, pickled red onion, herbs, fennel and toasted walnuts.\nAllergens: nuts (walnuts), mustard.',ingredients:''},
    es:{name:'VEGETARIANO',description:'Coliflor\nZanahorias y calabaza confitadas y ahumadas con especias, curry de verduras con coco, cebolla roja encurtida, hierbas, hinojo y nueces tostadas.\nAlérgenos: frutos de cáscara (nueces), mostaza.',ingredients:''}},
  {id:'11111111-1111-4111-8111-000000000007',hash:'e5c6a521abe9da22e0fbfee7f37133fb433180995bde2cc863be672d026a8289',
    en:{name:'HIBISCUS & ORANGE KOMBUCHA',description:'Filtered water\nUnrefined light cane sugar (consumed during fermentation)\nBlend of black and green tea\nSymbiotic kombucha culture\nHibiscus flowers\nOrange',ingredients:''},
    es:{name:'KOMBUCHA DE HIBISCO Y NARANJA',description:'Agua filtrada\nAzúcar de caña rubio sin refinar (consumido durante la fermentación)\nMezcla de té negro y té verde\nCultivo simbiótico de kombucha\nFlores de hibisco\nNaranja',ingredients:''}},
  {id:'11111111-1111-4111-8111-000000000008',hash:'924b0c621eb761dbacaba22aed84e953783f3efb0493891c09fba7b0b48a6e7e',
    en:{name:'RASPBERRY & WHITE TEA KOMBUCHA',description:'Filtered water\nSymbiotic kombucha culture\nCane sugar\nRaspberry (1.5%)\nWhite tea (redcurrant, raspberry, rose)',ingredients:''},
    es:{name:'KOMBUCHA DE FRAMBUESA Y TÉ BLANCO',description:'Agua filtrada\nCultivo simbiótico de kombucha\nAzúcar de caña\nFrambuesa (1,5 %)\nTé blanco (grosella, frambuesa, rosa)',ingredients:''}},
];
const translations=new Map(records.map(record=>[record.id,record]));
const fingerprint=d=>createHash('sha256').update(JSON.stringify({name:d.translations.fr.name,description:d.translations.fr.description})).digest('hex');
const unchangedPart=d=>({...d,translations:{fr:d.translations.fr}});
function translated(items) {
  assert.equal(items.filter(item=>item.lunchIncluded).length,records.length,'The lunch selection changed; inspect it again before updating');
  for(const record of records){
    const item=items.find(item=>item.id===record.id);
    assert.ok(item?.lunchIncluded,'A target item is missing or no longer included');
    assert.equal(fingerprint(item),record.hash,'The French original changed; translations must be reviewed');
    assert.equal(item.translations.fr.ingredients,'','The French ingredient list changed');
  }
  return items.map(item=>{
    const record=translations.get(item.id);
    if(!record)return item;
    return validateDish({...item,translations:{...item.translations,en:record.en,es:record.es}});
  });
}
const before=await readMenu();
const expected=translated(before);
assert.deepEqual(expected.map(unchangedPart),before.map(unchangedPart));
if(process.argv[3]==='--check'){
  for(const record of records){const current=before.find(d=>d.id===record.id);assert.deepEqual(current.translations.en,record.en);assert.deepEqual(current.translations.es,record.es);}
  console.log('TRANSLATIONS_VERIFIED: 5 positions; French originals, prices, categories and photos intact');
}else if(process.argv[3]==='--apply'){
  await updateMenu(items=>{
    assert.deepEqual(items,before,'The menu changed while preparing the update');
    return translated(items);
  });
  assert.deepEqual(await readMenu(),expected);
  console.log('TRANSLATIONS_SAVED: 5 positions; only English and Spanish texts changed');
}else{
  console.log('TRANSLATIONS_DRY_RUN_OK: 5 positions; only English and Spanish texts would change');
}
