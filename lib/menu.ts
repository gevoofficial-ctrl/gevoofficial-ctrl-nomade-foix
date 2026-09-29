import { promises as fs } from 'node:fs';
import path from 'node:path';

export type Lang = 'fr' | 'en' | 'es';
export type Translation = { name: string; description: string };
export type Dish = {
  id: string;
  category: string;
  translations: Record<Lang, Translation>;
  priceCents: number;
  imageUrl: string;
  videoUrl: string;
  allergens: number[];
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
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
    return data as Dish[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export function validateDish(input: unknown): Dish {
  if (!input || typeof input !== 'object') throw new Error('Invalid dish');
  const d = input as Record<string, unknown>;
  const str = (x: unknown, max: number) => typeof x === 'string' && x.length <= max ? x.trim() : null;
  const translations = {} as Record<Lang, Translation>;
  for (const lang of ['fr', 'en', 'es'] as const) {
    const t = d.translations && typeof d.translations === 'object'
      ? (d.translations as Record<string, unknown>)[lang] as Record<string, unknown> | undefined : undefined;
    const name = str(t?.name, 120), description = str(t?.description, 500);
    if (name === null || description === null || (lang === 'fr' && !name)) throw new Error('French name is required; translations must be valid');
    translations[lang] = { name, description };
  }
  const category = str(d.category, 80);
  const imageUrl = str(d.imageUrl, 500), videoUrl = str(d.videoUrl, 500);
  if (!category || imageUrl === null || videoUrl === null) throw new Error('Category or media URL is invalid');
  for (const url of [imageUrl, videoUrl]) {
    if (url && !(/^\/api\/menu\/media\/[a-f0-9-]{36}\.(jpg|png|webp|mp4|webm)$/.test(url) || /^https:\/\/[\w.-]+(?:\/[\w\-./%?=&]+)?$/.test(url))) throw new Error('Media URL must be HTTPS or an uploaded file');
  }
  if (!Number.isSafeInteger(d.priceCents) || (d.priceCents as number) < 0 || (d.priceCents as number) > 10000000) throw new Error('Invalid price');
  if (!Number.isSafeInteger(d.order) || Math.abs(d.order as number) > 100000) throw new Error('Invalid order');
  if (!Array.isArray(d.allergens) || d.allergens.length > 14 || d.allergens.some(n => !Number.isInteger(n) || n < 1 || n > 14)) throw new Error('Invalid allergens');
  const bool = (v: unknown) => typeof v === 'boolean';
  if (![d.vegetarian, d.vegan, d.glutenFree, d.available, d.signature].every(bool)) throw new Error('Invalid flags');
  return {
    id: typeof d.id === 'string' && /^[a-f0-9-]{36}$/.test(d.id) ? d.id : crypto.randomUUID(),
    category, translations, priceCents: d.priceCents as number, imageUrl, videoUrl,
    allergens: [...new Set(d.allergens as number[])].sort((a, b) => a - b),
    vegetarian: d.vegetarian as boolean, vegan: d.vegan as boolean,
    glutenFree: d.glutenFree as boolean, available: d.available as boolean,
    signature: d.signature as boolean, order: d.order as number,
  };
}

// A short exclusive lock protects the JSON file when Passenger serves concurrent requests.
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
  return d.translations[lang].name ? d.translations[lang] : d.translations.fr;
}
