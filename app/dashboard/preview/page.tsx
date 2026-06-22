import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ContactHub, type ContactHubMethod } from "@/components/contact-hub";
import { createClient } from "@/lib/supabase/server";

type LandingVisualMode = "classic" | "modern" | "compact";

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

type LandingVisualStyles = {
  page: string;
  container: string;
  previewPanel: string;
  previewTitle: string;
  previewText: string;
  previewBadge: string;
  hero: string;
  category: string;
  title: string;
  shortDescription: string;
  contentGrid: string;
  section: string;
  sectionTitle: string;
  mutedText: string;
  serviceList: string;
  serviceItem: string;
  primaryButton: string;
  secondaryButton: string;
  warningBox: string;
};

function normalizeLandingVisualMode(
  value: string | null | undefined,
): LandingVisualMode {
  if (value === "modern") return "modern";
  if (value === "compact") return "compact";

  return "classic";
}

function getVisualModeLabel(mode: LandingVisualMode): string {
  if (mode === "modern") return "Moderno";
  if (mode === "compact") return "Compacto";

  return "Clásico";
}

function getLandingVisualStyles(mode: LandingVisualMode): LandingVisualStyles {
  if (mode === "modern") {
    return {
      page: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white",
      container:
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8",
      previewPanel:
        "lp-fade-up rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur",
      previewTitle: "text-3xl font-bold tracking-tight text-white",
      previewText: "text-slate-300",
      previewBadge:
        "inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur",
      hero: "lp-fade-up overflow-hidden rounded-3xl border border-white/10 bg-white/10 px-6 py-10 shadow-2xl backdrop-blur md:px-10",
      category:
        "inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-950",
      title: "mt-3 text-4xl font-bold tracking-tight text-white md:text-6xl",
      shortDescription: "mt-4 max-w-2xl text-lg leading-8 text-slate-200",
      contentGrid: "grid gap-5 md:grid-cols-2",
      section:
        "lp-fade-up rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur",
      sectionTitle: "text-xl font-bold text-white",
      mutedText: "text-slate-300",
      serviceList: "mt-4 grid gap-3 sm:grid-cols-2",
      serviceItem:
        "lp-soft-interaction rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 shadow-lg hover:shadow-2xl",
      primaryButton:
        "lp-soft-interaction inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-lg hover:shadow-xl",
      secondaryButton:
        "lp-soft-interaction inline-flex rounded-2xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10",
      warningBox:
        "lp-fade-up rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm text-yellow-100",
    };
  }

  if (mode === "compact") {
    return {
      page: "min-h-screen bg-slate-100 text-slate-950",
      container:
        "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6",
      previewPanel:
        "lp-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
      previewTitle: "text-2xl font-bold tracking-tight text-slate-950",
      previewText: "text-slate-600",
      previewBadge:
        "inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700",
      hero: "lp-fade-up rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm",
      category:
        "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",
      title: "mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl",
      shortDescription: "mt-3 text-base leading-7 text-slate-700",
      contentGrid: "grid gap-4",
      section:
        "lp-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
      sectionTitle: "text-lg font-bold text-slate-950",
      mutedText: "text-slate-600",
      serviceList: "mt-4 grid gap-2",
      serviceItem:
        "lp-soft-interaction rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800",
      primaryButton:
        "lp-soft-interaction inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm",
      secondaryButton:
        "lp-soft-interaction inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-50",
      warningBox:
        "lp-fade-up rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900",
    };
  }

  return {
    page: "min-h-screen bg-slate-50 text-slate-950",
    container:
      "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6",
    previewPanel:
      "lp-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
    previewTitle: "text-3xl font-bold tracking-tight text-slate-950",
    previewText: "text-slate-600",
    previewBadge:
      "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm",
    hero: "lp-fade-up rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm md:px-10",
    category:
      "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",
    title: "mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl",
    shortDescription: "mt-4 max-w-2xl text-lg leading-8 text-slate-700",
    contentGrid: "grid gap-6 md:grid-cols-2",
    section:
      "lp-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
    sectionTitle: "text-xl font-bold text-slate-950",
    mutedText: "text-slate-600",
    serviceList: "mt-4 grid gap-3 sm:grid-cols-2",
    serviceItem:
      "lp-soft-interaction rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 hover:shadow-md",
    primaryButton:
      "lp-soft-interaction inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm hover:shadow-md",
    secondaryButton:
      "lp-soft-interaction inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-50",
    warningBox:
      "lp-fade-up rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900",
  };
}

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

function PreviewCard({
  business,
  visualMode,
  visualModeLabel,
  visualStyles,
}: {
  business: BusinessPreview;
  visualMode: LandingVisualMode;
  visualModeLabel: string;
  visualStyles: LandingVisualStyles;
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

  const isCompact = visualMode === "compact";

  return (
    <article className="space-y-6">
      <section className={visualStyles.hero}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className={visualStyles.category}>
              {business.category || "Categoría pendiente"}
            </p>

            <h2 className={visualStyles.title}>
              {business.name || "Nombre del negocio"}
            </h2>

            <p className={visualStyles.shortDescription}>
              {business.short_description ||
                "Aquí aparecerá la descripción corta de tu negocio."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/contacts"
                className={visualStyles.primaryButton}
              >
                Revisar contactos
              </Link>

              <Link
                href="/dashboard/business"
                className={visualStyles.secondaryButton}
              >
                Editar información
              </Link>
            </div>
          </div>

          <div className={visualStyles.previewBadge}>
            Modo {visualModeLabel}
          </div>
        </div>
      </section>

      <section className={visualStyles.contentGrid}>
        {!isCompact ? (
          <div className={visualStyles.section}>
            <h3 className={visualStyles.sectionTitle}>Sobre el negocio</h3>

            <p
              className={`mt-3 whitespace-pre-line text-sm leading-6 ${visualStyles.mutedText}`}
            >
              {business.long_description ||
                "Cuando agregues una descripción larga, aparecerá aquí para dar más contexto a tus visitantes."}
            </p>
          </div>
        ) : null}

        <div className={visualStyles.section}>
          <h3 className={visualStyles.sectionTitle}>Servicios principales</h3>

          {services.length > 0 ? (
            <ul className={visualStyles.serviceList}>
              {services.map((service) => (
                <li key={service} className={visualStyles.serviceItem}>
                  {service}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`mt-3 text-sm leading-6 ${visualStyles.mutedText}`}>
              Aquí aparecerán los servicios principales del negocio.
            </p>
          )}
        </div>

        <div className={visualStyles.section}>
          <h3 className={visualStyles.sectionTitle}>Horarios</h3>

          <p
            className={`mt-3 whitespace-pre-line text-sm leading-6 ${visualStyles.mutedText}`}
          >
            {business.opening_hours ||
              "Aquí aparecerán los horarios de atención."}
          </p>
        </div>

        <div className={visualStyles.section}>
          <h3 className={visualStyles.sectionTitle}>Ubicación</h3>

          <p className={`mt-3 text-sm leading-6 ${visualStyles.mutedText}`}>
            {locationText ||
              "Aquí aparecerá la dirección o zona de atención del negocio."}
          </p>

          {business.location_url ? (
            <a
              href={business.location_url}
              target="_blank"
              rel="noreferrer"
              className={`mt-4 ${visualStyles.secondaryButton}`}
            >
              Ver ubicación autorizada
            </a>
          ) : null}
        </div>

        {isCompact && business.long_description ? (
          <div className={visualStyles.section}>
            <h3 className={visualStyles.sectionTitle}>Sobre el negocio</h3>

            <p
              className={`mt-3 whitespace-pre-line text-sm leading-6 ${visualStyles.mutedText}`}
            >
              {business.long_description}
            </p>
          </div>
        ) : null}

        <div className={visualStyles.section}>
          <h3 className={visualStyles.sectionTitle}>Centro de contacto</h3>

          <p className={`mt-2 text-sm ${visualStyles.mutedText}`}>
            El botón flotante de contacto aparece fijo en la pantalla. En la
            landing pública solo mostrará métodos activos y aprobados.
          </p>
        </div>
      </section>
    </article>
  );
}

async function PreviewContent() {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/auth/login");
  }

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

  const visualMode = normalizeLandingVisualMode(business.visual_mode);
  const visualModeLabel = getVisualModeLabel(visualMode);
  const visualStyles = getLandingVisualStyles(visualMode);

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
    <main className={visualStyles.page}>
      <div className={visualStyles.container}>
        <section className={visualStyles.previewPanel}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className={visualStyles.previewBadge}>
                Vista previa · Modo {visualModeLabel}
              </p>

              <h1 className={`mt-3 ${visualStyles.previewTitle}`}>
                Así se verá tu landing
              </h1>

              <p className={`mt-3 max-w-2xl ${visualStyles.previewText}`}>
                Esta vista previa usa tus datos guardados. Puedes revisarla
                antes de publicar la landing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/business"
                className={visualStyles.secondaryButton}
              >
                Editar negocio
              </Link>

              <Link
                href="/dashboard/contacts"
                className={visualStyles.secondaryButton}
              >
                Editar contactos
              </Link>

              {business.slug ? (
                <Link
                  href={`/b/${business.slug}`}
                  className={visualStyles.secondaryButton}
                >
                  Ver URL pública
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {contactsError ? (
          <section className={visualStyles.warningBox}>
            <p className="font-medium">No se pudieron cargar los contactos.</p>
            <p className="mt-1 text-xs">{contactsError.message}</p>
          </section>
        ) : null}

        <PreviewCard
          business={business}
          visualMode={visualMode}
          visualModeLabel={visualModeLabel}
          visualStyles={visualStyles}
        />
      </div>

      {/* 
        Importante:
        ContactHub se renderiza fuera de las tarjetas animadas.

        Si lo colocamos dentro de una sección con transform,
        su position: fixed puede dejar de comportarse como flotante global.
      */}
      <ContactHub
  contacts={contacts ?? []}
  visualMode={visualMode}
  showInlinePanel={false}
/>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewLoading />}>
      <PreviewContent />
    </Suspense>
  );
}