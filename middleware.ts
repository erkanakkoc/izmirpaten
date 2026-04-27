import { NextResponse, type NextRequest } from 'next/server'

// Auth kontrolü layout'ta yapılıyor — middleware sadece pass-through
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
