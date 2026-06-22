// app/dashboard/metrics/page.tsx

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CONTACT_TYPES,
  CONTACT_TYPE_LABELS,
  isContactType,
  type ContactType,
} from "@/lib/contact-types";
import { createClient } from "@/lib/supabase/server";

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
};

type ClickRow = {
  business_id: string;
  contact_type: string | null;
};

/**
 * Página principal.
 *
 * Importante:
 * Esta función NO debe ser async.
 *
 * Next.js 16 con Cache Components necesita que la lectura de datos
 * no cacheados o privados esté dentro de un <Suspense>.
 */
export default function MetricsPage() {
  return (
    <Suspense fallback={<MetricsLoading />}>
      <MetricsContent />
    </Suspense>
  );
}

/**
 * Estado visual mientras Next.js obtiene datos privados del usuario.
 *
 * Esto evita el error:
 * "Uncached data was accessed outside of <Suspense>"
 */
function MetricsLoading() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="text-2xl font-bold">Métricas de contacto</h1>
        <p className="text-sm text-muted-foreground">
          Cargando métricas...
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-xl border bg-card p-5 shadow-sm" />
        <div className="h-28 rounded-xl border bg-card p-5 shadow-sm" />
        <div className="h-28 rounded-xl border bg-card p-5 shadow-sm" />
      </section>
    </main>
  );
}

/**
 * Contenido real de métricas.
 *
 * Esta función sí puede ser async porque está dentro de <Suspense>.
 * Aquí consultamos:
 * - usuario actual;
 * - negocios del usuario;
 * - clics relacionados con esos negocios.
 */
async function MetricsContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: businesses, error: businessesError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (businessesError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">Métricas</h1>

        <p className="mt-4 text-sm text-red-600">
          No se pudieron cargar los negocios.
        </p>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Volver al dashboard
        </Link>
      </main>
    );
  }

  const businessRows = (businesses ?? []) as BusinessRow[];

  if (businessRows.length === 0) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">Métricas</h1>

        <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Todavía no tienes negocios registrados.
          </p>

          <Link
            href="/dashboard/business"
            className="mt-4 inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Registrar negocio
          </Link>
        </div>
      </main>
    );
  }

  const businessIds = businessRows.map((business) => business.id);

  const { data: clicks, error: clicksError } = await supabase
    .from("contact_clicks")
    .select("business_id, contact_type")
    .in("business_id", businessIds);

  if (clicksError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">Métricas</h1>

        <p className="mt-4 text-sm text-red-600">
          No se pudieron cargar las métricas.
        </p>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Volver al dashboard
        </Link>
      </main>
    );
  }

  const clickRows = (clicks ?? []) as ClickRow[];

  const clicksByType = CONTACT_TYPES.reduce(
    (accumulator, contactType) => {
      accumulator[contactType] = 0;
      return accumulator;
    },
    {} as Record<ContactType, number>,
  );

  const clicksByBusiness = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string | null;
      count: number;
    }
  >();

  for (const business of businessRows) {
    clicksByBusiness.set(business.id, {
      id: business.id,
      name: business.name,
      slug: business.slug,
      count: 0,
    });
  }

  for (const click of clickRows) {
    if (isContactType(click.contact_type)) {
      clicksByType[click.contact_type] += 1;
    }

    const businessMetric = clicksByBusiness.get(click.business_id);

    if (businessMetric) {
      businessMetric.count += 1;
    }
  }

  const totalClicks = clickRows.length;

  const contactRows = CONTACT_TYPES.map((contactType) => ({
    type: contactType,
    label: CONTACT_TYPE_LABELS[contactType],
    count: clicksByType[contactType],
  }));

  const businessMetricRows = Array.from(clicksByBusiness.values());

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="text-2xl font-bold">Métricas de contacto</h1>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Volver al dashboard
        </Link>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Clics totales</p>
          <p className="mt-2 text-3xl font-bold">{totalClicks}</p>
        </article>

        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Negocios en tu cuenta
          </p>
          <p className="mt-2 text-3xl font-bold">{businessRows.length}</p>
        </article>

        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Canales medidos</p>
          <p className="mt-2 text-3xl font-bold">{CONTACT_TYPES.length}</p>
        </article>
      </section>

      <section className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Clics por canal</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Canal</th>
                <th className="py-3 pr-4 font-medium">Clics</th>
              </tr>
            </thead>

            <tbody>
              {contactRows.map((row) => (
                <tr key={row.type} className="border-b last:border-b-0">
                  <td className="py-3 pr-4">{row.label}</td>
                  <td className="py-3 pr-4 font-semibold">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Clics por negocio</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Negocio</th>
                <th className="py-3 pr-4 font-medium">Slug</th>
                <th className="py-3 pr-4 font-medium">Clics</th>
              </tr>
            </thead>

            <tbody>
              {businessMetricRows.map((business) => (
                <tr key={business.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4">{business.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {business.slug ?? "Sin slug"}
                  </td>
                  <td className="py-3 pr-4 font-semibold">
                    {business.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {totalClicks === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          Todavía no hay clics registrados. Abre una landing publicada y prueba
          un método de contacto para confirmar que las métricas aumentan.
        </div>
      ) : null}
    </main>
  );
}