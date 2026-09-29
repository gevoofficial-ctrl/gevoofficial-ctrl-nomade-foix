import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { mediaDirectory } from '../../../../../lib/menu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const types: Record<string,string> = {jpg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'};
export async function GET(_request: NextRequest, {params}: {params:Promise<{name:string}>}) {
  const {name} = await params;
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|mp4|webm)$/.test(name)) return new NextResponse(null,{status:404});
  try {
    const data = await fs.readFile(path.join(mediaDirectory(),name));
    const ext = name.split('.').pop()!;
    return new NextResponse(data, {headers:{'Content-Type':types[ext],'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
  } catch(e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return new NextResponse(null,{status:404});
    throw e;
  }
}
