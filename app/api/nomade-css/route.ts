import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

// Keep the legacy URL for already-open pages; new pages use bundled CSS.
export const dynamic = 'force-static';

export function GET() {
  return new NextResponse(readFileSync(path.join(process.cwd(),'app/site.css'),'utf8'), {
    headers: {
      'Content-Type':'text/css; charset=utf-8',
      'Cache-Control':'public, max-age=31536000, immutable',
    },
  });
}
