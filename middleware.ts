// Middleware reale: src/middleware.ts
// Next.js con src/ directory ignora questo file e carica src/middleware.ts
export {}


export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
