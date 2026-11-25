import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { mediaDirectory, menuFile } from './menu';
import { defaultHomeContent, homeLanguages, homePhotoAlts, homePhotos, homeTextSections, type HomeContent } from './home-content';

const imagePath = /^\/api\/menu\/media\/([a-f0-9-]{36}\.(?:jpg|png|webp))$/;
const contentFile = () => path.join(path.dirname(menuFile()), 'home.json');

export type HomeVersion = { content: HomeContent; revision: string | null };

export class HomeValidationError extends Error {}
export class HomeConflictError extends Error {}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HomeValidationError('Le contenu de la page est incomplet.');
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, max: number, label: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HomeValidationError(`${label} doit contenir de 1 à ${max} caractères.`);
  }
  return value.trim();
}

function parseContent(value: unknown): HomeContent {
  const input = record(value);
  const texts = record(input.texts);
  const photos = record(input.photos);
  const alt = record(input.alt);
  const content = defaultHomeContent();
  for (const lang of homeLanguages) {
    const langTexts = record(texts[lang]);
    const langAlt = record(alt[lang]);
    for (const section of homeTextSections) {
      for (const { key, label, max } of section.fields) {
        content.texts[lang][key] = requiredText(langTexts[key], max, `${label} (${lang.toUpperCase()})`);
      }
    }
    for (const key of homePhotoAlts) {
      content.alt[lang][key] = requiredText(langAlt[key], 180, `Description de la photo (${lang.toUpperCase()})`);
    }
  }
  for (const key of homePhotos) {
    const src = photos[key];
    if (typeof src !== 'string' || (src !== '' && !imagePath.test(src))) {
      throw new HomeValidationError('Choisissez une image JPEG, PNG ou WebP depuis le formulaire.');
    }
    content.photos[key] = src;
  }
  return content;
}

export async function readHome(): Promise<HomeVersion> {
  let raw: string;
  try {
    raw = await fs.readFile(contentFile(), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { content: defaultHomeContent(), revision: null };
    }
    throw error;
  }
  const saved = record(JSON.parse(raw));
  if (saved.version !== 1 || typeof saved.revision !== 'string') {
    throw new Error('Version du contenu de l’accueil invalide.');
  }
  return { revision: saved.revision, content: parseContent(saved.content) };
}

export async function publicHomeContent() {
  try {
    return (await readHome()).content;
  } catch (error) {
    console.error('Erreur de lecture du contenu de l’accueil', error);
    return defaultHomeContent();
  }
}

export async function publishHome(value: unknown): Promise<HomeVersion> {
  const payload = record(value);
  const content = parseContent(payload.content);
  for (const src of new Set(Object.values(content.photos).filter(Boolean))) {
    const file = path.join(mediaDirectory(), src.split('/').pop()!);
    if (!(await fs.stat(file).catch(() => null))?.isFile()) {
      throw new HomeValidationError('Une image est introuvable. Importez-la de nouveau.');
    }
  }

  const file = contentFile();
  const lockPath = file + '.lock';
  await fs.mkdir(path.dirname(file), { recursive: true });
  const lock = await fs.open(lockPath, 'wx', 0o600).catch(error => {
    if (error.code === 'EEXIST') throw new HomeConflictError('Une publication est en cours. Réessayez.');
    throw error;
  });
  try {
    if ((await readHome()).revision !== payload.revision) {
      throw new HomeConflictError('La page a été modifiée depuis son ouverture. Copiez vos changements puis rechargez la page.');
    }
    const result = { content, revision: randomUUID() };
    const temp = file + '.' + result.revision + '.tmp';
    try {
      await fs.writeFile(temp, JSON.stringify({ version: 1, ...result }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
      await fs.rename(temp, file);
    } finally {
      await fs.rm(temp, { force: true });
    }
    return result;
  } finally {
    await lock.close();
    await fs.rm(lockPath, { force: true });
  }
}
