import { NextRequest, NextResponse } from 'next/server';
import { authorized, sameOrigin } from '../../../../../lib/admin-auth';
import { updateMenu, validateDish } from '../../../../../lib/menu';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: NextRequest, { params }: Context) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();
    if (JSON.stringify(body).length > 12000) return NextResponse.json({ error: 'Dish too large' }, { status: 413 });
    const dish = validateDish({ ...body, id });
    await updateMenu(items => {
      if (!items.some(d => d.id === id)) throw new Error('Dish not found');
      return items.map(d => d.id === id ? dish : d);
    });
    return NextResponse.json(dish);
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const { id } = await params;
  await updateMenu(items => items.filter(d => d.id !== id));
  return NextResponse.json({ ok: true });
}
