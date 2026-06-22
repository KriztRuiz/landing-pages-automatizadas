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
 * Fase 8.3:
 * - la landing pública respeta visual_mode;
 * - soporta classic, modern y compact;
 * - mantiene ContactHub fuera de contenedores con transform;
 * - conserva métricas de clics usando businessId;
 * - solo muestra negocios publicados;
 * - solo muestra contactos activos y aprobados.
 */

type PublicLandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type LandingVisualMode = "classic" | "modern" | "compact";

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
 * Clases visuales por modo.
 *
 * Mantenemos una sola landing:
 * - mismos datos;
 * - misma lógica;
 * - diferente presentación visual.
 */
type LandingVisualStyles = {
  page: string;
  container: string;
  hero: string;
  category: string;
  title: string;
  shortDescription: string;
  heroActions: string;
  primaryButton: string;
  secondaryButton: string;
  contentGrid: string;
  section: string;
  sectionWide: string;
  sectionTitle: string;
  mutedText: string;
  serviceList: string;
  serviceItem: string;
  photosGrid: string;
  photo: string;
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
 * Normaliza visual_mode.
 *
 * Si por cualquier razón llega null o un valor incorrecto,
 * usamos classic como modo seguro.
 */
function normalizeLandingVisualMode(
  value: string | null | undefined,
): LandingVisualMode {
  if (value === "modern") return "modern";
  if (value === "compact") return "compact";

  return "classic";
}

/**
 * Regresa clases de Tailwind según el modo visual.
 *
 * No usamos librerías extra.
 * Solo Tailwind + clases CSS simples:
 * - lp-fade-up
 * - lp-soft-interaction
 */
function getLandingVisualStyles(mode: LandingVisualMode): LandingVisualStyles {
  if (mode === "modern") {
    return {
      page: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white",
      container:
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8",
      hero: "lp-fade-up overflow-hidden rounded-3xl border border-white/10 bg-white/10 px-6 py-12 shadow-2xl backdrop-blur md:px-10 md:py-16",
      category:
        "inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-950",
      title: "mt-4 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl",
      shortDescription: "mt-5 max-w-2xl text-lg leading-8 text-slate-200",
      heroActions: "mt-8 flex flex-wrap gap-3",
      primaryButton:
        "lp-soft-interaction inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg hover:shadow-xl",
      secondaryButton:
        "lp-soft-interaction inline-flex rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10",
      contentGrid: "grid gap-5 md:grid-cols-2",
      section:
        "lp-fade-up rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur md:p-8",
      sectionWide:
        "lp-fade-up rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur md:col-span-2 md:p-8",
      sectionTitle: "text-2xl font-bold text-white",
      mutedText: "text-slate-300",
      serviceList: "mt-5 grid gap-3 sm:grid-cols-2",
      serviceItem:
        "lp-soft-interaction rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 shadow-lg hover:shadow-2xl",
      photosGrid: "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      photo:
        "lp-soft-interaction aspect-video w-full rounded-2xl border border-white/10 object-cover shadow-lg hover:shadow-2xl",
    };
  }

  if (mode === "compact") {
    return {
      page: "min-h-screen bg-slate-100 text-slate-950",
      container:
        "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6",
      hero: "lp-fade-up rounded-2xl border border-slate-200 bg-white px-5 py-7 shadow-sm",
      category:
        "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",
      title: "mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl",
      shortDescription: "mt-3 text-base leading-7 text-slate-700",
      heroActions: "mt-6 grid gap-3 sm:grid-cols-2",
      primaryButton:
        "lp-soft-interaction inline-flex justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm",
      secondaryButton:
        "lp-soft-interaction inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-50",
      contentGrid: "grid gap-4",
      section:
        "lp-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
      sectionWide:
        "lp-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
      sectionTitle: "text-lg font-bold text-slate-950",
      mutedText: "text-slate-600",
      serviceList: "mt-4 grid gap-2",
      serviceItem:
        "lp-soft-interaction rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800",
      photosGrid: "mt-4 grid gap-3",
      photo:
        "lp-soft-interaction aspect-video w-full rounded-xl border border-slate-200 object-cover shadow-sm",
    };
  }

  return {
    page: "min-h-screen bg-slate-50 text-slate-950",
    container:
      "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6",
    hero: "lp-fade-up rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm md:px-10 md:py-14",
    category:
      "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",
    title: "mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl",
    shortDescription: "mt-5 max-w-2xl text-lg leading-8 text-slate-700",
    heroActions: "mt-8 flex flex-wrap gap-3",
    primaryButton:
      "lp-soft-interaction inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm hover:shadow-md",
    secondaryButton:
      "lp-soft-interaction inline-flex rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-50",
    contentGrid: "grid gap-6 md:grid-cols-2",
    section:
      "lp-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8",
    sectionWide:
      "lp-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 md:p-8",
    sectionTitle: "text-2xl font-bold text-slate-950",
    mutedText: "text-slate-600",
    serviceList: "mt-5 grid gap-3 sm:grid-cols-2",
    serviceItem:
      "lp-soft-interaction rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 hover:shadow-md",
    photosGrid: "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
    photo:
      "lp-soft-interaction aspect-video w-full rounded-2xl border border-slate-200 object-cover shadow-sm hover:shadow-md",
  };
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
 * Pantalla temporal mientras se cargan datos públicos.
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
 * Hero principal de la landing.
 *
 * Es la primera sección que ve el visitante.
 */
function LandingHero({
  business,
  styles,
}: {
  business: PublicBusiness;
  styles: LandingVisualStyles;
}) {
  return (
    <section className={styles.hero}>
      <p className={styles.category}>
        {business.category || "Negocio local"}
      </p>

      <h1 className={styles.title}>
        {business.name || "Negocio local"}
      </h1>

      <p className={styles.shortDescription}>
        {business.short_description ||
          "Información proporcionada por el negocio."}
      </p>

      <div className={styles.heroActions}>
        <a href="#contacto" className={styles.primaryButton}>
          Contactar ahora
        </a>

        {business.location_url ? (
          <a
            href={business.location_url}
            target="_blank"
            rel="noreferrer"
            className={styles.secondaryButton}
          >
            Ver ubicación
          </a>
        ) : null}
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
function BusinessPhotos({
  business,
  styles,
}: {
  business: PublicBusiness;
  styles: LandingVisualStyles;
}) {
  const photos = business.photos ?? [];

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className={styles.sectionWide}>
      <h2 className={styles.sectionTitle}>Fotos</h2>

      <div className={styles.photosGrid}>
        {photos.map((photoUrl, index) => (
          // Para el PMV dejamos <img> porque las URLs de fotos pueden variar.
          // Configurar dominios externos para next/image lo dejamos para una fase posterior.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${photoUrl}-${index}`}
            src={photoUrl}
            alt={`Foto ${index + 1} de ${business.name || "negocio local"}`}
            className={styles.photo}
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
function BusinessDetails({
  business,
  styles,
  visualMode,
}: {
  business: PublicBusiness;
  styles: LandingVisualStyles;
  visualMode: LandingVisualMode;
}) {
  const services = business.services ?? [];
  const locationText = getLocationText(business);
  const isCompact = visualMode === "compact";

  return (
    <section className={styles.contentGrid}>
      {!isCompact ? (
        <article className={styles.section}>
          <h2 className={styles.sectionTitle}>Sobre el negocio</h2>

          <p
            className={`mt-4 whitespace-pre-line text-sm leading-7 ${styles.mutedText}`}
          >
            {business.long_description ||
              business.short_description ||
              "Este negocio aún no agregó una descripción detallada."}
          </p>
        </article>
      ) : null}

      <article className={styles.section}>
        <h2 className={styles.sectionTitle}>Servicios principales</h2>

        {services.length > 0 ? (
          <ul className={styles.serviceList}>
            {services.map((service) => (
              <li key={service} className={styles.serviceItem}>
                {service}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`mt-4 text-sm leading-7 ${styles.mutedText}`}>
            Servicios pendientes de agregar.
          </p>
        )}
      </article>

      <article className={styles.section}>
        <h2 className={styles.sectionTitle}>Horarios</h2>

        <p
          className={`mt-4 whitespace-pre-line text-sm leading-7 ${styles.mutedText}`}
        >
          {business.opening_hours || "Horarios pendientes de agregar."}
        </p>
      </article>

      <article className={styles.section}>
        <h2 className={styles.sectionTitle}>Ubicación</h2>

        <p className={`mt-4 text-sm leading-7 ${styles.mutedText}`}>
          {locationText || "Ubicación pendiente de agregar."}
        </p>

        {business.location_url ? (
          <a
            href={business.location_url}
            target="_blank"
            rel="noreferrer"
            className={`mt-5 ${styles.secondaryButton}`}
          >
            Ver ubicación autorizada
          </a>
        ) : null}
      </article>

      {isCompact && business.long_description ? (
        <article className={styles.section}>
          <h2 className={styles.sectionTitle}>Sobre el negocio</h2>

          <p
            className={`mt-4 whitespace-pre-line text-sm leading-7 ${styles.mutedText}`}
          >
            {business.long_description}
          </p>
        </article>
      ) : null}
    </section>
  );
}

/**
 * Bloque informativo del ContactHub.
 *
 * El botón flotante real se renderiza fuera del layout animado.
 * Esto evita que position: fixed se rompa por transform de lp-fade-up.
 */
function ContactInfoSection({ styles }: { styles: LandingVisualStyles }) {
  return (
    <section id="contacto" className={styles.sectionWide}>
      <h2 className={styles.sectionTitle}>Centro de contacto</h2>

      <p className={`mt-4 max-w-2xl text-sm leading-7 ${styles.mutedText}`}>
        Usa el botón flotante de contacto para elegir el canal que prefieras.
        El negocio solo muestra métodos activos y aprobados.
      </p>
    </section>
  );
}

/**
 * Permite a Next intentar prerenderizar slugs publicados.
 *
 * Si algo falla durante build, regresamos arreglo vacío para no romper.
 */
export async function generateStaticParams() {
  const supabase = createPublicSupabaseClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("slug")
    .eq("is_published", true)
    .not("slug", "is", null);

  if (error || !data) {
    return [];
  }

  return data
    .map((business) => ({
      slug: business.slug,
    }))
    .filter((item): item is { slug: string } => Boolean(item.slug));
}

/**
 * Contenido real de la landing pública.
 *
 * Aquí consultamos Supabase usando el slug recibido por URL.
 */
async function PublicLandingContent({ slug }: { slug: string }) {
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

  const visualMode = normalizeLandingVisualMode(business.visual_mode);
  const styles = getLandingVisualStyles(visualMode);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LandingHero business={business} styles={styles} />

        <BusinessPhotos business={business} styles={styles} />

        <BusinessDetails
          business={business}
          styles={styles}
          visualMode={visualMode}
        />

        <ContactInfoSection styles={styles} />
      </div>

      {/*
        ContactHub debe ir fuera de tarjetas/secciones animadas.

        Si lo metemos dentro de una sección con transform,
        su position: fixed puede quedar atrapado y dejar de flotar
        correctamente en toda la pantalla.
      */}
      <ContactHub
  businessId={business.id}
  contacts={contacts ?? []}
  visualMode={visualMode}
  showInlinePanel={false}
/>
    </main>
  );
}
/**
 * Página principal de /b/[slug].
 *
 * Con Cache Components activo, dejamos la consulta dinámica dentro
 * de un componente async envuelto por Suspense.
 */
export default async function PublicLandingPage({
  params,
}: PublicLandingPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<PublicLandingLoading />}>
      <PublicLandingContent slug={slug} />
    </Suspense>
  );
}