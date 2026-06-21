import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  publishBusiness,
  unpublishBusiness,
} from "@/app/dashboard/business/actions";
import { createClient } from "@/lib/supabase/server";

/**
 * Archivo afectado:
 * app/dashboard/page.tsx
 *
 * En esta fase el dashboard ya no solo muestra accesos.
 * Ahora también muestra:
 * - estado de publicación;
 * - requisitos mínimos para publicar;
 * - botón para publicar;
 * - botón para despublicar;
 * - enlace público cuando la landing ya está publicada.
 */

type DashboardBusiness = {
  id: string;
  name: string | null;
  slug: string | null;
  category: string | null;
  short_description: string | null;
  is_published: boolean | null;
};

type DashboardPageProps = {
  searchParams?: Promise<{
    publication?: string;
  }>;
};

/**
 * Fallback visual del dashboard.
 *
 * Next.js 16 con Cache Components necesita que las lecturas dinámicas
 * como sesión, cookies, searchParams o datos privados estén dentro de Suspense.
 */
function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Panel del negocio
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Cargando tu panel...
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Estamos verificando tu sesión antes de mostrar tus datos privados.
        </p>
      </section>
    </main>
  );
}

/**
 * Convierte el resultado de la Server Action en un mensaje visible.
 *
 * Ejemplo:
 * /dashboard?publication=missing
 */
function getPublicationMessage(publicationStatus?: string): {
  title: string;
  description: string;
  className: string;
} | null {
  if (publicationStatus === "published") {
    return {
      title: "Landing publicada",
      description: "Tu landing ya está disponible en su URL pública.",
      className: "border-green-200 bg-green-50 text-green-800",
    };
  }

  if (publicationStatus === "unpublished") {
    return {
      title: "Landing despublicada",
      description: "La URL pública ya no mostrará la landing del negocio.",
      className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    };
  }

  if (publicationStatus === "missing") {
    return {
      title: "Todavía no se puede publicar",
      description:
        "Completa los requisitos marcados antes de publicar la landing.",
      className: "border-red-200 bg-red-50 text-red-800",
    };
  }

  if (publicationStatus === "no-business") {
    return {
      title: "Primero registra tu negocio",
      description:
        "Necesitas guardar los datos básicos del negocio antes de publicar.",
      className: "border-red-200 bg-red-50 text-red-800",
    };
  }

  if (publicationStatus === "error") {
    return {
      title: "No se pudo cambiar la publicación",
      description:
        "Ocurrió un error al actualizar el estado. Revisa la consola o intenta de nuevo.",
      className: "border-red-200 bg-red-50 text-red-800",
    };
  }

  return null;
}

/**
 * Valida visualmente los requisitos mínimos.
 *
 * Esta validación ayuda al dueño a entender qué falta.
 * La validación importante también existe en el servidor dentro de actions.ts.
 */
function getPublicationRequirements(
  business: DashboardBusiness | null,
  activeVerifiedContactsCount: number,
) {
  return [
    {
      label: "Nombre del negocio",
      ok: Boolean(business?.name?.trim()),
    },
    {
      label: "Slug público",
      ok: Boolean(
        business?.slug?.trim() &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(business.slug),
      ),
    },
    {
      label: "Categoría",
      ok: Boolean(business?.category?.trim()),
    },
    {
      label: "Descripción corta",
      ok: Boolean(business?.short_description?.trim()),
    },
    {
      label: "Al menos un contacto activo y aprobado",
      ok: activeVerifiedContactsCount > 0,
    },
  ];
}

/**
 * Contenido privado real del dashboard.
 *
 * Aquí:
 * 1. Revisamos sesión.
 * 2. Leemos el negocio del usuario.
 * 3. Contamos contactos activos y verificados.
 * 4. Mostramos estado y acciones de publicación.
 */
async function DashboardContent({
  searchParams,
}: {
  searchParams?: DashboardPageProps["searchParams"];
}) {
  const resolvedSearchParams = await searchParams;
  const publicationMessage = getPublicationMessage(
    resolvedSearchParams?.publication,
  );

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub;
  const userEmail = data.claims.email;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, category, short_description, is_published")
    .eq("owner_id", userId)
    .maybeSingle<DashboardBusiness>();

  if (businessError) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
          <h1 className="text-2xl font-bold">
            No se pudo cargar el dashboard
          </h1>

          <p className="mt-2 text-sm">{businessError.message}</p>
        </section>
      </main>
    );
  }

  /**
   * Solo contamos contactos que podrían mostrarse públicamente:
   * - is_enabled = true
   * - is_verified = true
   */
  const { count: activeVerifiedContactsCount, error: contactsError } = business
    ? await supabase
        .from("contact_methods")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("is_enabled", true)
        .eq("is_verified", true)
    : { count: 0, error: null };

  if (contactsError) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
          <h1 className="text-2xl font-bold">
            No se pudieron cargar los contactos
          </h1>

          <p className="mt-2 text-sm">{contactsError.message}</p>
        </section>
      </main>
    );
  }

  const safeContactsCount = activeVerifiedContactsCount ?? 0;
  const requirements = getPublicationRequirements(business, safeContactsCount);
  const canPublish = requirements.every((requirement) => requirement.ok);
  const publicUrl = business?.slug ? `/b/${business.slug}` : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Panel del negocio
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Bienvenido a tu panel
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Desde aquí puedes registrar la información de tu negocio, administrar
          contactos, revisar la vista previa y publicar o despublicar tu
          landing.
        </p>

        <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Sesión activa:</p>
          <p className="mt-1 text-muted-foreground">{userEmail}</p>
        </div>
      </section>

      {publicationMessage ? (
        <section
          className={`rounded-2xl border p-5 shadow-sm ${publicationMessage.className}`}
        >
          <h2 className="font-semibold">{publicationMessage.title}</h2>
          <p className="mt-1 text-sm">{publicationMessage.description}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Estado de publicación
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {business?.is_published ? "Landing publicada" : "Landing privada"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {business?.is_published
                ? "Tu landing puede abrirse desde la URL pública."
                : "Tu landing todavía no está visible para visitantes. Puedes verla desde la vista previa privada."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/preview"
              className="inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Ver preview
            </Link>

            {business?.is_published && publicUrl ? (
              <Link
                href={publicUrl}
                target="_blank"
                className="inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Abrir pública
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-muted/30 p-4">
          <h3 className="font-semibold">Requisitos para publicar</h3>

          <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            {requirements.map((requirement) => (
              <li
                key={requirement.label}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
              >
                <span
                  aria-hidden="true"
                  className={
                    requirement.ok ? "text-green-600" : "text-red-600"
                  }
                >
                  {requirement.ok ? "✓" : "•"}
                </span>

                <span
                  className={
                    requirement.ok
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {requirement.label}
                </span>
              </li>
            ))}
          </ul>

          {!canPublish ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Puedes intentar publicar, pero el servidor no lo permitirá hasta
              que todos los requisitos estén completos.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {business?.is_published ? (
            <form action={unpublishBusiness}>
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 sm:w-auto"
              >
                Despublicar landing
              </button>
            </form>
          ) : (
            <form action={publishBusiness}>
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 sm:w-auto"
              >
                Publicar landing
              </button>
            </form>
          )}

          <Link
            href="/dashboard/business"
            className="inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Editar datos
          </Link>

          <Link
            href="/dashboard/contacts"
            className="inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Editar contactos
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/business"
          className="rounded-xl border bg-card p-5 shadow-sm transition hover:bg-muted/40"
        >
          <h2 className="font-semibold">Datos del negocio</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Guarda nombre, categoría, descripción, horarios, ubicación y
            servicios.
          </p>
        </Link>

        <Link
          href="/dashboard/contacts"
          className="rounded-xl border bg-card p-5 shadow-sm transition hover:bg-muted/40"
        >
          <h2 className="font-semibold">Métodos de contacto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Administra teléfono, WhatsApp, correo, redes y enlaces aprobados.
          </p>
        </Link>

        <Link
          href="/dashboard/preview"
          className="rounded-xl border bg-card p-5 shadow-sm transition hover:bg-muted/40"
        >
          <h2 className="font-semibold">Vista previa</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisa cómo se verá tu landing aunque todavía no esté publicada.
          </p>
        </Link>
      </section>
    </main>
  );
}

/**
 * Página principal de /dashboard.
 *
 * La página mantiene Suspense para que las lecturas privadas sigan funcionando
 * correctamente con Cache Components.
 */
export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}