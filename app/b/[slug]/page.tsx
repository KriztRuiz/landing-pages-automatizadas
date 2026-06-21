import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ContactHub, type ContactHubMethod } from "@/components/contact-hub";

/**
 * Archivo afectado:
 * app/b/[slug]/page.tsx
 *
 * Landing pública del negocio.
 *
 * Esta página:
 * 1. Busca un negocio por slug.
 * 2. Solo lo muestra si is_published = true.
 * 3. Muestra los datos públicos del negocio.
 * 4. Muestra ContactHub.
 * 5. Solo carga contactos activos y aprobados:
 *    - is_enabled = true
 *    - is_verified = true
 * 6. Oculta negocios no publicados usando notFound().
 *
 * Nota importante para Next.js 16:
 * Con Cache Components activo, las consultas dinámicas deben ir dentro
 * de un componente envuelto por <Suspense>. Por eso esta página se divide en:
 *
 * - PublicLandingPage: componente ligero que solo crea el Suspense.
 * - PublicLandingContent: componente async que lee Supabase.
 */

type PublicLandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * Tipo mínimo del negocio público.
 *
 * No incluimos owner_id ni datos privados.
 * Esta página solo necesita información que puede ver un visitante.
 */
type PublicBusiness = {
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
  photos: string[] | null;
  visual_mode: string | null;
  is_published: boolean | null;
};

/**
 * Cliente público de Supabase.
 *
 * Usamos la publishable key porque esta página es pública.
 * La seguridad real sigue dependiendo de las políticas RLS de Supabase.
 *
 * No usamos cookies ni sesión, porque el visitante no necesita login.
 */
function createPublicSupabaseClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * Pantalla temporal mientras se cargan datos públicos.
 *
 * Este fallback permite que Next.js tenga una interfaz inmediata
 * mientras el componente async consulta Supabase.
 */
function PublicLandingLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:py-12">
      <section className="rounded-3xl border bg-card px-6 py-10 shadow-sm md:px-10 md:py-14">
        <p className="text-sm font-medium text-muted-foreground">
          Landing pública
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Cargando negocio...
        </h1>

        <p className="mt-5 max-w-2xl text-muted-foreground">
          Estamos preparando la información pública del negocio.
        </p>
      </section>
    </main>
  );
}

/**
 * Convierte el modo visual interno en una etiqueta legible.
 *
 * En esta fase todavía no hacemos 3 diseños distintos.
 * Solo mostramos el modo guardado para confirmar que el dato llega bien.
 */
function getVisualModeLabel(visualMode: string | null): string {
  if (visualMode === "modern") return "Moderno";
  if (visualMode === "compact") return "Compacto";

  return "Clásico";
}

/**
 * Une las partes de la ubicación en un solo texto.
 *
 * Ejemplo:
 * "Calle 1, Sabinas Hidalgo, Nuevo León, México"
 */
function getLocationText(business: PublicBusiness): string {
  return [
    business.address,
    business.city,
    business.state,
    business.country,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Hero principal de la landing.
 *
 * Es la primera sección que ve el visitante.
 */
function LandingHero({ business }: { business: PublicBusiness }) {
  return (
    <section className="rounded-3xl border bg-card px-6 py-10 shadow-sm md:px-10 md:py-14">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {business.category || "Negocio local"}
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            {business.name}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {business.short_description ||
              "Información proporcionada por el negocio."}
          </p>
        </div>

        <div className="w-fit rounded-full border bg-background px-4 py-2 text-sm font-medium">
          Modo {getVisualModeLabel(business.visual_mode)}
        </div>
      </div>
    </section>
  );
}

/**
 * Sección de fotos autorizadas.
 *
 * Para mantener simple el PMV:
 * - usamos <img> normal;
 * - no usamos next/image todavía;
 * - asumimos que las URLs fueron proporcionadas o autorizadas por el negocio.
 */
function BusinessPhotos({ business }: { business: PublicBusiness }) {
  const photos = business.photos ?? [];

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-bold">Fotos</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photoUrl, index) => (
          // Para el PMV dejamos <img> porque las URLs de fotos pueden variar.
          // Configurar dominios externos para next/image lo dejamos para una fase posterior.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${photoUrl}-${index}`}
            src={photoUrl}
            alt={`Foto ${index + 1} de ${business.name || "negocio local"}`}
            className="aspect-video w-full rounded-2xl border object-cover"
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Secciones informativas principales.
 *
 * Aquí el visitante entiende:
 * - qué ofrece el negocio;
 * - dónde está o dónde atiende;
 * - cuándo atiende;
 * - qué servicios tiene.
 */
function BusinessDetails({ business }: { business: PublicBusiness }) {
  const services = business.services ?? [];
  const locationText = getLocationText(business);

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <article className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-bold">Sobre el negocio</h2>

        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
          {business.long_description ||
            business.short_description ||
            "Este negocio aún no agregó una descripción detallada."}
        </p>
      </article>

      <article className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-bold">Ubicación</h2>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {locationText || "Ubicación pendiente de agregar."}
        </p>

        {business.location_url ? (
          <a
            href={business.location_url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Ver ubicación autorizada
          </a>
        ) : null}
      </article>

      <article className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-bold">Horarios</h2>

        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
          {business.opening_hours || "Horarios pendientes de agregar."}
        </p>
      </article>

      <article className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-bold">Servicios principales</h2>

        {services.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {services.map((service) => (
              <li
                key={service}
                className="rounded-xl border bg-background px-4 py-3 text-sm"
              >
                {service}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Servicios pendientes de agregar.
          </p>
        )}
      </article>
    </section>
  );
}

/**
 * Contenido público real de la landing.
 *
 * Este componente sí es async y sí consulta Supabase.
 * Por eso debe renderizarse dentro de <Suspense>.
 */
async function PublicLandingContent({ params }: PublicLandingPageProps) {
  const { slug } = await params;

  const supabase = createPublicSupabaseClient();

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
      photos,
      visual_mode,
      is_published
    `,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<PublicBusiness>();

  /**
   * No mostramos errores técnicos al visitante.
   *
   * Para el visitante, un negocio inexistente o no publicado
   * simplemente debe comportarse como página no encontrada.
   */
  if (businessError || !business) {
    notFound();
  }

  const { data: contacts } = await supabase
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 pb-28 md:py-12">
      <LandingHero business={business} />

      <BusinessPhotos business={business} />

      <BusinessDetails business={business} />

      <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
        <ContactHub contacts={contacts ?? []} />
      </section>
    </main>
  );
}

/**
 * Página principal de /b/[slug].
 *
 * No consulta Supabase directamente.
 * Solo crea el límite de Suspense para que Next.js pueda manejar
 * correctamente los datos dinámicos en Cache Components.
 */
export default function PublicLandingPage({ params }: PublicLandingPageProps) {
  return (
    <Suspense fallback={<PublicLandingLoading />}>
      <PublicLandingContent params={params} />
    </Suspense>
  );
}