import type { Dish, Translation } from './menu';

type Source = { category: string; translations: { fr: Translation } };
type Translated = { en: Translation & { category: string }; es: Translation & { category: string } };

export async function translateMenuText(source: Source): Promise<Translated> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Traduction indisponible : configurez OPENAI_API_KEY sur le serveur. Le plat n’a pas été enregistré.');
  const { name, description } = source.translations.fr;
  if (!name.trim() || name.length > 120 || description.length > 500 || !source.category.trim() || source.category.length > 80) {
    throw new Error('Vérifiez les textes français avant de traduire.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini', store: false,
        instructions: 'Translate a restaurant menu from French to natural English and Spanish. Preserve dish identity, culinary terms, ingredients, allergens, and meaning exactly. Do not invent ingredients or claims. Translate category, name and description. Return only the requested structured result.',
        input: JSON.stringify({ category: source.category, name, description }),
        text: { format: { type:'json_schema', name:'menu_translation', strict:true, schema: {
          type:'object', additionalProperties:false, required:['en','es'], properties: {
            en: { type:'object', additionalProperties:false, required:['category','name','description'], properties:{category:{type:'string'},name:{type:'string'},description:{type:'string'}} },
            es: { type:'object', additionalProperties:false, required:['category','name','description'], properties:{category:{type:'string'},name:{type:'string'},description:{type:'string'}} },
          },
        } } },
      }),
    });
    if (!response.ok) throw new Error(`Service de traduction indisponible (${response.status}). Le plat n’a pas été enregistré.`);
    const result = await response.json();
    const content = result.output?.flatMap((item: {content?: {type:string;text?:string}[]}) => item.content ?? [])
      .find((part: {type:string;text?:string}) => part.type === 'output_text')?.text;
    if (!content) throw new Error('Le service de traduction n’a pas renvoyé de texte. Le plat n’a pas été enregistré.');
    const translated: Translated = JSON.parse(content);
    for (const lang of ['en','es'] as const) {
      const t = translated[lang];
      if (typeof t?.name !== 'string' || !t.name.trim() || t.name.length > 120 ||
          typeof t.description !== 'string' || t.description.length > 500 ||
          typeof t.category !== 'string' || !t.category.trim() || t.category.length > 80) {
        throw new Error('Traduction incomplète. Le plat n’a pas été enregistré.');
      }
    }
    return translated;
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw new Error('Délai de traduction dépassé. Réessayez.');
    throw error;
  } finally { clearTimeout(timer); }
}

export async function withAutomaticTranslations(input: Dish, previous?: Dish): Promise<Dish> {
  const changed = !previous || previous.category !== input.category ||
    previous.translations.fr.name !== input.translations.fr.name ||
    previous.translations.fr.description !== input.translations.fr.description;
  if (!changed && input.translations.en.name && input.translations.es.name && input.categoryTranslations?.en && input.categoryTranslations?.es) return input;
  const result = await translateMenuText(input);
  return {
    ...input,
    translations: {fr:input.translations.fr,en:{name:result.en.name,description:result.en.description},es:{name:result.es.name,description:result.es.description}},
    categoryTranslations: {fr:input.category,en:result.en.category,es:result.es.category},
  };
}
