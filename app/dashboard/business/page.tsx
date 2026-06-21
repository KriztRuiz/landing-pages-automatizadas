import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BusinessForm, type Business } from "./business-form";

/**
 * Pantalla de carga para Next.js 16 con Cache Components.
 *
 * La lectura de sesión y negocio depende de cookies/datos privados,
 * por eso debe ocurrir dentro de un componente envuelto en Suspense.
 */
function BusinessPageLoading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Datos del negocio
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Cargando formulario...
        </h1>

        <p className="mt-3 text-muted-foreground">
          Estamos preparando la información de tu negocio.
        </p>
      </section>
    </main>
  );
}

/**
 * Contenido privado real de /dashboard/business.
 *
 * Aquí:
 * 1. Revisamos sesión.
 * 2. Leemos el negocio del usuario.
 * 3. Mandamos esos datos al formulario.
 */
async function BusinessPageContent() {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/auth/login");
  }

  /**
   * Leemos solo el negocio del usuario autenticado.
   *
   * RLS también protege esta consulta.
   * Además usamos owner_id = userId para dejar clara la intención.
   */
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      category,
      short_description,
      long_description,
      address,
      city,
      state,
      country,
      location_url,
      opening_hours,
      services,
      visual_mode
    `,
    )
    .eq("owner_id", userId)
    .maybeSingle<Business>();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Panel del negocio
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Datos de tu negocio
        </h1>

        <p className="mt-3 text-muted-foreground">
          Guarda la información básica que después se usará para generar tu
          landing pública.
        </p>
      </section>

      {businessError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">No se pudo cargar el negocio.</p>
          <p className="mt-1 text-xs">{businessError.message}</p>
        </div>
      ) : null}

      <BusinessForm business={business} />
    </main>
  );
}

/**
 * Página principal de /dashboard/business.
 *
 * No lee datos directamente.
 * Solo envuelve el contenido privado en Suspense.
 */
export default function BusinessPage() {
  return (
    <Suspense fallback={<BusinessPageLoading />}>
      <BusinessPageContent />
    </Suspense>
  );
}