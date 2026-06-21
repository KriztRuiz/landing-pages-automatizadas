import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ContactHub, type ContactHubMethod } from "@/components/contact-hub";
import { createClient } from "@/lib/supabase/server";

/**
 * Archivo afectado:
 * app/dashboard/preview/page.tsx
 *
 * Esta página muestra una vista previa privada de la landing.
 *
 * En esta fase agregamos ContactHub:
 * - se leen métodos de contacto del negocio;
 * - se filtran solo activos y aprobados;
 * - se muestran dentro de la preview y como botón flotante.
 */

/**
 * Tipo mínimo del negocio para la vista previa.
 *
 * No usamos todos los campos de la tabla todavía.
 * Solo los necesarios para que el dueño confirme cómo se verá su landing.
 */
type BusinessPreview = {
  id: string;
  name: string | null;
  slug: string | null;
  category: string | null;
  short_description: string | null;
  long_description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  location_url: string | null;
  opening_hours: string | null;
  services: string[] | null;
  visual_mode: string | null;
  is_published: boolean | null;
};

/**
 * Pantalla temporal mientras Next/Supabase revisan sesión y datos.
 *
 * En Next.js 16 con Cache Components, las lecturas privadas como cookies,
 * sesión o datos del usuario deben quedar dentro de un componente con Suspense.
 */
function PreviewLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Vista previa
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Cargando vista previa...
        </h1>

        <p className="mt-3 text-muted-foreground">
          Estamos preparando la información guardada de tu negocio.
        </p>
      </section>
    </main>
  );
}

/**
 * Convierte el modo visual interno en texto entendible.
 *
 * Más adelante estos modos cambiarán estilos reales de landing.
 * En esta fase solo los mostramos para confirmar que el dato se guarda.
 */
function getVisualModeLabel(visualMode: string | null): string {
  if (visualMode === "modern") return "Moderno";
  if (visualMode === "compact") return "Compacto";

  return "Clásico";
}

/**
 * Componente visual de la landing privada.
 *
 * Esta NO es la landing pública final.
 * Solo es una vista previa dentro del panel privado.
 */
function PreviewCard({
  business,
  contacts,
}: {
  business: BusinessPreview;
  contacts: ContactHubMethod[];
}) {
  const services = business.services ?? [];

  const locationText = [
    business.address,
    business.city,
    business.state,
    business.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <section className="border-b bg-muted/30 px-6 py-10 md:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {business.category || "Categoría pendiente"}
            </p>

            <h2 className="mt-2 text-4xl font-bold tracking-tight">
              {business.name || "Nombre del negocio"}
            </h2>

            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {business.short_description ||
                "Aquí aparecerá la descripción corta de tu negocio."}
            </p>
          </div>

          <div className="rounded-full border bg-background px-4 py-2 text-sm font-medium">
            Modo {getVisualModeLabel(business.visual_mode)}
          </div>
        </div>
      </section>

      <section className="grid gap-8 px-6 py-8 md:grid-cols-2 md:px-10">
        <div>
          <h3 className="text-lg font-semibold">Sobre el negocio</h3>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {business.long_description ||
              "Cuando agregues una descripción larga, aparecerá aquí para dar más contexto a tus visitantes."}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Ubicación</h3>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {locationText ||
              "Aquí aparecerá la dirección o zona de atención del negocio."}
          </p>

          {business.location_url ? (
            <a
              href={business.location_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Ver ubicación autorizada
            </a>
          ) : null}
        </div>

        <div>
          <h3 className="text-lg font-semibold">Horarios</h3>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {business.opening_hours ||
              "Aquí aparecerán los horarios de atención."}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Servicios principales</h3>

          {services.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {services.map((service) => (
                <li
                  key={service}
                  className="rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {service}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Aquí aparecerán los servicios principales del negocio.
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <ContactHub contacts={contacts} />
        </div>
      </section>
    </article>
  );
}

/**
 * Contenido privado real de /dashboard/preview.
 *
 * Aquí:
 * 1. Revisamos que exista sesión.
 * 2. Obtenemos el negocio del usuario.
 * 3. Obtenemos contactos activos y aprobados.
 * 4. Mostramos una vista previa privada aunque todavía no esté publicado.
 */
async function PreviewContent() {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/auth/login");
  }

  /**
   * Leemos únicamente el negocio del usuario autenticado.
   *
   * RLS ya protege la tabla, pero también filtramos por owner_id
   * para que la intención sea clara en el código.
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
      visual_mode,
      is_published
    `,
    )
    .eq("owner_id", userId)
    .maybeSingle<BusinessPreview>();

  if (businessError) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
          <h1 className="text-2xl font-bold">
            No se pudo cargar la vista previa
          </h1>

          <p className="mt-2 text-sm">{businessError.message}</p>

          <Link
            href="/dashboard/business"
            className="mt-5 inline-flex rounded-lg border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100"
          >
            Volver a editar negocio
          </Link>
        </section>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Vista previa
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Aún no tienes negocio registrado
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Primero guarda los datos básicos de tu negocio para poder generar
            una vista previa.
          </p>

          <Link
            href="/dashboard/business"
            className="mt-5 inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Ir a datos del negocio
          </Link>
        </section>
      </main>
    );
  }

  /**
   * Aquí está la regla central de ContactHub:
   *
   * La preview solo muestra métodos activos y aprobados.
   *
   * Si un contacto está desactivado o no aprobado,
   * puede existir en /dashboard/contacts, pero NO aparece aquí.
   */
  const { data: contacts, error: contactsError } = await supabase
    .from("contact_methods")
    .select(
      `
      id,
      type,
      label,
      value,
      url
    `,
    )
    .eq("business_id", business.id)
    .eq("is_enabled", true)
    .eq("is_verified", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<ContactHubMethod[]>();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Vista previa
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Así se verá tu landing
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Esta vista previa usa tus datos guardados. Puedes revisarla antes de
          publicar la landing.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/business"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Editar negocio
          </Link>

          <Link
            href="/dashboard/contacts"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Editar contactos
          </Link>

          {business.slug ? (
            <Link
              href={`/b/${business.slug}`}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Ver URL pública
            </Link>
          ) : null}
        </div>
      </section>

      {contactsError ? (
        <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <p className="font-medium">No se pudieron cargar los contactos.</p>
          <p className="mt-1 text-xs">{contactsError.message}</p>
        </section>
      ) : null}

      <PreviewCard business={business} contacts={contacts ?? []} />
    </main>
  );
}

/**
 * Página principal de /dashboard/preview.
 *
 * No lee datos directamente.
 * Solo envuelve el contenido privado en Suspense.
 */
export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewLoading />}>
      <PreviewContent />
    </Suspense>
  );
}