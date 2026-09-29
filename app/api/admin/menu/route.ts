import { NextRequest, NextResponse } from 'next/server';
import { authorized, sameOrigin } from '../../../../lib/admin-auth';
import { readMenu, sortedMenu, updateMenu, validateDish } from '../../../../lib/menu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(sortedMenu(await readMenu()), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  try {
    const body = await request.json();
    if (JSON.stringify(body).length > 12000) return NextResponse.json({ error: 'Dish too large' }, { status: 413 });
    const dish = validateDish({ ...body, id: undefined });
    await updateMenu(items => [...items, dish]);
    return NextResponse.json(dish, { status: 201 });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
