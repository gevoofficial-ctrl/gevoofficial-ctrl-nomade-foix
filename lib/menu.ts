import { promises as fs } from 'node:fs';
import path from 'node:path';

export type Lang = 'fr' | 'en' | 'es';
export type Translation = { name: string; description: string; ingredients: string };
export type Dish = {
  id: string;
  category: string;
  translations: Record<Lang, Translation>;
  imageUrl: string;
  available: boolean;
  signature: boolean;
  order: number;
  regularPriceCents: number | null;
  lunchIncluded: boolean;
  lunchPriceCents: number | null;
};

export const menuFile = () => process.env.NOMADE_MENU_FILE || path.join(process.cwd(), 'data', 'menu.json');
const file = menuFile;
export const mediaDirectory = () => path.join(path.dirname(file()), 'media');

export async function readMenu(): Promise<Dish[]> {
  try {
    const data: unknown = JSON.parse(await fs.readFile(file(), 'utf8'));
    if (!Array.isArray(data)) throw new Error('Les données de la carte ne sont pas valides.');
    return data.map(migrateDish);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function migrateDish(input: unknown): Dish {
  const d = input as Record<string, unknown>;
  const oldTranslations = d.translations && typeof d.translations === 'object' ? d.translations as Record<string, unknown> : {};
  const translations = {} as Record<Lang, Translation>;
  for (const lang of ['fr','en','es'] as const) {
    const t = (oldTranslations[lang] || {}) as Record<string, unknown>;
    translations[lang] = {
      name: typeof t.name === 'string' ? t.name : '',
      description: typeof t.description === 'string' ? t.description : '',
      ingredients: typeof t.ingredients === 'string' ? t.ingredients : '',
    };
  }
  return {
    id: typeof d.id === 'string' ? d.id : crypto.randomUUID(),
    category: typeof d.category === 'string' ? d.category : 'Plats',
    translations,
    imageUrl: typeof d.imageUrl === 'string' ? d.imageUrl : '',
    available: typeof d.available === 'boolean' ? d.available : true,
    signature: typeof d.signature === 'boolean' ? d.signature : false,
    order: Number.isSafeInteger(d.order) ? d.order as number : 0,
    regularPriceCents: Number.isSafeInteger(d.regularPriceCents) && (d.regularPriceCents as number) > 0 ? d.regularPriceCents as number : null,
    lunchIncluded: typeof d.lunchIncluded === 'boolean' ? d.lunchIncluded : false,
    lunchPriceCents: Number.isSafeInteger(d.lunchPriceCents) && (d.lunchPriceCents as number) > 0 ? d.lunchPriceCents as number : null,
  };
}

export function validateDish(input: unknown): Dish {
  if (!input || typeof input !== 'object') throw new Error('La position n’est pas valide.');
  const d = input as Record<string, unknown>;
  const str = (x: unknown, max: number) => typeof x === 'string' && x.length <= max ? x.trim() : null;
  const category = str(d.category, 80);
  if (!category) throw new Error('La catégorie est obligatoire.');
  const translations = {} as Record<Lang, Translation>;
  for (const lang of ['fr','en','es'] as const) {
    const t = d.translations && typeof d.translations === 'object'
      ? (d.translations as Record<string, unknown>)[lang] as Record<string, unknown> | undefined : undefined;
    const name = str(t?.name, 120), description = str(t?.description, 500), ingredients = str(t?.ingredients, 500);
    if (name === null || description === null || ingredients === null || (lang === 'fr' && !name)) throw new Error('Le nom français est obligatoire. Vérifiez la longueur et le contenu des textes.');
    translations[lang] = { name, description, ingredients };
  }
  const imageUrl = str(d.imageUrl, 500);
  if (imageUrl === null) throw new Error('L’adresse de la photo n’est pas valide.');
  if (imageUrl && !(/^\/images\/(ravioli|magret|cocktails)\.jpg$/.test(imageUrl) || /^\/api\/menu\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(imageUrl) || /^https:\/\/[\w.-]+(?:\/[\w\-./%?=&]+)?$/.test(imageUrl))) throw new Error('Utilisez une adresse HTTPS ou une photo téléchargée.');
  if (!Number.isSafeInteger(d.order) || Math.abs(d.order as number) > 100000) throw new Error('L’ordre d’affichage n’est pas valide.');
  if (typeof d.available !== 'boolean' || typeof d.signature !== 'boolean') throw new Error('Les options de disponibilité ou de mise en avant ne sont pas valides.');
  const regularPriceCents = d.regularPriceCents === null || d.regularPriceCents === undefined ? null : d.regularPriceCents;
  const lunchPriceCents = d.lunchPriceCents === null || d.lunchPriceCents === undefined ? null : d.lunchPriceCents;
  if (regularPriceCents !== null && (!Number.isSafeInteger(regularPriceCents) || (regularPriceCents as number) <= 0 || (regularPriceCents as number) > 1000000)) throw new Error('Le prix normal doit être compris entre 0,01 € et 10 000 €.');
  if (lunchPriceCents !== null && (!Number.isSafeInteger(lunchPriceCents) || (lunchPriceCents as number) <= 0 || (lunchPriceCents as number) > 1000000)) throw new Error('Le prix spécial doit être compris entre 0,01 € et 10 000 €.');
  if (typeof d.lunchIncluded !== 'boolean') throw new Error('L’option Déjeuner à emporter n’est pas valide.');
  if (d.lunchIncluded && !['plats','boissons'].includes(category.toLocaleLowerCase('fr'))) throw new Error('Déjeuner: utilisez la catégorie Plats ou Boissons');
  if (d.lunchIncluded && lunchPriceCents === null) throw new Error('Un prix spécial est obligatoire pour Déjeuner à emporter.');
  return {
    id: typeof d.id === 'string' && /^[a-f0-9-]{36}$/.test(d.id) ? d.id : crypto.randomUUID(),
    category, translations, imageUrl,
    available: d.available, signature: d.signature, order: d.order as number,
    regularPriceCents: regularPriceCents as number | null,
    lunchIncluded: d.lunchIncluded,
    lunchPriceCents: lunchPriceCents as number | null,
  };
}

export async function updateMenu(change: (items: Dish[]) => Dish[]): Promise<Dish[]> {
  const target = file();
  await fs.mkdir(path.dirname(target), { recursive: true });
  let lock: fs.FileHandle | undefined;
  for (let i = 0; i < 30; i++) {
    try { lock = await fs.open(target + '.lock', 'wx'); break; }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  if (!lock) throw new Error('La carte est en cours de modification. Réessayez.');
  try {
    const items = change(await readMenu());
    const temp = target + '.' + crypto.randomUUID() + '.tmp';
    try { await fs.writeFile(temp, JSON.stringify(items, null, 2) + '\n', { mode: 0o600 }); await fs.rename(temp, target); }
    finally { await fs.rm(temp, { force: true }); }
    return items;
  } finally { await lock.close(); await fs.rm(target + '.lock', { force: true }); }
}

export function sortedMenu(items: Dish[]) { return [...items].sort((a,b) => a.order - b.order || a.translations.fr.name.localeCompare(b.translations.fr.name)); }
export function localized(d: Dish, lang: Lang): Translation {
  const french = d.translations.fr;
  const translation = d.translations[lang];
  return {
    name: translation.name || french.name,
    description: translation.description || french.description,
    ingredients: translation.ingredients || french.ingredients,
  };
}
