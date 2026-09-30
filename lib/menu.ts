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
};

const file = () => process.env.NOMADE_MENU_FILE || path.join(process.cwd(), 'data', 'menu.json');
export const mediaDirectory = () => path.join(path.dirname(file()), 'media');

export async function readMenu(): Promise<Dish[]> {
  try {
    const data: unknown = JSON.parse(await fs.readFile(file(), 'utf8'));
    if (!Array.isArray(data)) throw new Error('Invalid menu data');
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
  };
}

export function validateDish(input: unknown): Dish {
  if (!input || typeof input !== 'object') throw new Error('Invalid dish');
  const d = input as Record<string, unknown>;
  const str = (x: unknown, max: number) => typeof x === 'string' && x.length <= max ? x.trim() : null;
  const category = str(d.category, 80);
  if (!category) throw new Error('Category is required');
  const translations = {} as Record<Lang, Translation>;
  for (const lang of ['fr','en','es'] as const) {
    const t = d.translations && typeof d.translations === 'object'
      ? (d.translations as Record<string, unknown>)[lang] as Record<string, unknown> | undefined : undefined;
    const name = str(t?.name, 120), description = str(t?.description, 500), ingredients = str(t?.ingredients, 500);
    if (name === null || description === null || ingredients === null || (lang === 'fr' && !name)) throw new Error('French name is required; dish text must be valid');
    translations[lang] = { name, description, ingredients };
  }
  const imageUrl = str(d.imageUrl, 500);
  if (imageUrl === null) throw new Error('Invalid image URL');
  if (imageUrl && !(/^\/api\/menu\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(imageUrl) || /^https:\/\/[\w.-]+(?:\/[\w\-./%?=&]+)?$/.test(imageUrl))) throw new Error('Image URL must be HTTPS or an uploaded file');
  if (!Number.isSafeInteger(d.order) || Math.abs(d.order as number) > 100000) throw new Error('Invalid order');
  if (typeof d.available !== 'boolean' || typeof d.signature !== 'boolean') throw new Error('Invalid flags');
  return {
    id: typeof d.id === 'string' && /^[a-f0-9-]{36}$/.test(d.id) ? d.id : crypto.randomUUID(),
    category, translations, imageUrl,
    available: d.available, signature: d.signature, order: d.order as number,
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
  if (!lock) throw new Error('Menu is busy. Please retry.');
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
