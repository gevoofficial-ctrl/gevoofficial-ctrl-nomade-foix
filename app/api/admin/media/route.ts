import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { authorized, sameOrigin } from '../../../../lib/admin-auth';
import { mediaDirectory } from '../../../../lib/menu';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error:'Unauthorized' }, { status:401 });
  if (!sameOrigin(request)) return NextResponse.json({ error:'Invalid origin' }, { status:403 });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 32 * 1024 * 1024) return NextResponse.json({ error:'File too large' }, { status:413 });
  const form = await request.formData().catch(() => null);
  const upload = form?.get('file');
  if (!(upload instanceof File)) return NextResponse.json({ error:'Choose a file' }, { status:400 });
  const video = upload.type === 'video/mp4' || upload.type === 'video/webm';
  if (upload.size < 12 || upload.size > (video ? 30 : 8) * 1024 * 1024) return NextResponse.json({ error:'File size exceeds the limit' }, { status:413 });
  const data = Buffer.from(await upload.arrayBuffer());
  const kind = data.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff])) && upload.type === 'image/jpeg' ? 'jpg'
    : data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && upload.type === 'image/png' ? 'png'
    : data.toString('ascii',0,4) === 'RIFF' && data.toString('ascii',8,12) === 'WEBP' && upload.type === 'image/webp' ? 'webp'
    : data.toString('ascii',4,8) === 'ftyp' && upload.type === 'video/mp4' ? 'mp4'
    : data.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])) && upload.type === 'video/webm' ? 'webm' : null;
  if (!kind) return NextResponse.json({ error:'Use a JPEG, PNG, WebP, MP4 or WebM file' }, { status:415 });
  await fs.mkdir(mediaDirectory(), { recursive:true });
  const name = `${crypto.randomUUID()}.${kind}`;
  await fs.writeFile(path.join(mediaDirectory(),name), data, { flag:'wx', mode:0o600 });
  return NextResponse.json({ url:`/api/menu/media/${name}`, type: video?'video':'image' }, { status:201 });
}
