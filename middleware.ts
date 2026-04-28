import { NextResponse, type NextRequest } from 'next/server'

// Auth kontrolü her portalin kendi layout'unda yapılıyor
// Middleware sadece cookie'leri pass-through eder
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/trainer/:path*', '/student/:path*'],
}
