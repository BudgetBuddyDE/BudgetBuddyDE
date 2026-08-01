import {createAvatar} from '@dicebear/core';
import * as thumbs from '@dicebear/thumbs';
import {type NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl;
  const seed = searchParams.get('seed') ?? 'default';

  const avatar = createAvatar(thumbs, {seed});
  const svg = avatar.toString();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=315360000, immutable',
    },
  });
}
