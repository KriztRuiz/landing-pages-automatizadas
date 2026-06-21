import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Archivo afectado:
 * proxy.ts
 *
 * El proxy solo debe proteger rutas privadas.
 *
 * Regla del proyecto:
 * - /dashboard/* es privado.
 * - /protected es privado.
 * - /b/[slug] es público.
 * - /auth/* es público.
 *
 * Antes, el matcher mandaba casi todas las rutas a updateSession().
 * Eso provocaba que una landing pública despublicada redirigiera a /auth/login,
 * cuando lo correcto es que /b/[slug] sea pública y, si no existe o no está
 * publicada, la página pública decida mostrar notFound().
 */
function isPrivatePath(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/protected");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * Si la ruta no es privada, no revisamos sesión.
   *
   * Ejemplos públicos:
   * - /
   * - /auth/login
   * - /auth/sign-up
   * - /b/taqueria-demo
   */
  if (!isPrivatePath(pathname)) {
    return NextResponse.next();
  }

  /**
   * Solo las rutas privadas pasan por la lógica de Supabase.
   *
   * Ahí sí tiene sentido mandar al usuario a /auth/login
   * cuando no tiene sesión activa.
   */
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - imágenes comunes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
