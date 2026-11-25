import { type NextRequest, NextResponse } from 'next/server';
import { authorized, sameOrigin } from '../../../../lib/admin-auth';
import { HomeConflictError, HomeValidationError, publishHome, readHome } from '../../../../lib/home-content-store';

export const runtime = 'nodejs';

const noStore = { 'Cache-Control': 'no-store' };
const failure = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

export async function GET(request: NextRequest) {
  if (!authorized(request)) return failure('Connexion requise.', 401);
  try {
    return NextResponse.json(await readHome(), { headers: noStore });
  } catch {
    return failure('Impossible de lire le contenu de la page d’accueil.', 500);
  }
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) return failure('Connexion requise.', 401);
  if (!sameOrigin(request)) return failure('Origine non valide.', 403);
  const maxBytes = 64 * 1024;
  const tooLarge = () => failure('Le contenu dépasse la taille autorisée.', 413);
  if (Number(request.headers.get('content-length')) > maxBytes) return tooLarge();
  const reader = request.body?.getReader();
  if (!reader) return failure('Contenu manquant.', 400);

  let payload: unknown;
  try {
    let size = 0;
    const decoder = new TextDecoder();
    let raw = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return tooLarge();
      }
      raw += decoder.decode(value, { stream: true });
    }
    payload = JSON.parse(raw + decoder.decode());
  } catch {
    return failure('Le contenu envoyé n’est pas valide.', 400);
  } finally {
    reader.releaseLock();
  }

  try {
    return NextResponse.json(await publishHome(payload), { headers: noStore });
  } catch (error) {
    if (error instanceof HomeValidationError) return failure(error.message, 400);
    if (error instanceof HomeConflictError) return failure(error.message, 409);
    console.error('Erreur de publication de l’accueil', error);
    return failure('Impossible de publier la page d’accueil.', 500);
  }
}
