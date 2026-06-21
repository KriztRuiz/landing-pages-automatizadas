
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ContactMethodForm } from "./contact-method-form";
import {
  ContactMethodList,
  type ContactMethod,
} from "./contact-method-list";

/**
 * Archivo afectado:
 * app/dashboard/contacts/page.tsx
 *
 * Página privada para administrar ContactHub.
 *
 * Flujo:
 * 1. Revisar sesión.
 * 2. Leer el negocio del usuario.
 * 3. Leer métodos de contacto del negocio.
 * 4. Mostrar formulario y lista editable.
 */

type BusinessForContacts = {
  id: string;
  name: string | null;
  slug: string | null;
};

function ContactsPageLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          ContactHub
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Cargando métodos de contacto...
        </h1>

        <p className="mt-3 text-muted-foreground">
          Estamos preparando los canales de contacto de tu negocio.
        </p>
      </section>
    </main>
  );
}

async function ContactsPageContent() {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/auth/login");
  }

  /**
   * Primero obtenemos el negocio del usuario.
   *
   * Sin negocio no podemos crear métodos de contacto,
   * porque contact_methods necesita business_id.
   */
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("owner_id", userId)
    .maybeSingle<BusinessForContacts>();

  if (businessError) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
          <h1 className="text-2xl font-bold">
            No se pudo cargar tu negocio
          </h1>

          <p className="mt-2 text-sm">{businessError.message}</p>
        </section>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            ContactHub
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Primero registra tu negocio
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Antes de agregar métodos de contacto necesitas guardar los datos
            básicos del negocio.
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
   * Leemos los métodos del negocio.
   *
   * RLS protege esta consulta y además filtramos por business_id.
   */
  const { data: contacts, error: contactsError } = await supabase
    .from("contact_methods")
    .select(
      `
      id,
      business_id,
      type,
      label,
      value,
      url,
      is_enabled,
      is_verified,
      sort_order,
      created_at,
      updated_at
    `,
    )
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<ContactMethod[]>();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Panel del negocio
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Métodos de contacto
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Administra los canales que aparecerán en ContactHub para{" "}
          <span className="font-medium text-foreground">
            {business.name || "tu negocio"}
          </span>
          .
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/business"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Editar negocio
          </Link>

          <Link
            href="/dashboard/preview"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Ver preview
          </Link>
        </div>
      </section>

      {contactsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">No se pudieron cargar los contactos.</p>
          <p className="mt-1 text-xs">{contactsError.message}</p>
        </div>
      ) : null}

      <ContactMethodForm />

      <ContactMethodList contacts={contacts ?? []} />
    </main>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsPageLoading />}>
      <ContactsPageContent />
    </Suspense>
  );
}