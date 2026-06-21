/**
 * Archivo afectado:
 * app/dashboard/contacts/contact-method-list.tsx
 *
 * Lista editable de métodos de contacto.
 *
 * Este componente puede ser Server Component porque:
 * - recibe los contactos desde page.tsx;
 * - usa formularios HTML normales;
 * - cada formulario llama una Server Action directamente.
 */

import {
  deleteContactMethod,
  updateContactMethod,
} from "./actions";
import {
  CONTACT_TYPE_OPTIONS,
  getContactTypeLabel,
  type ContactMethodType,
} from "./contact-method-types";

export type ContactMethod = {
  id: string;
  business_id: string;
  type: ContactMethodType;
  label: string | null;
  value: string | null;
  url: string | null;
  is_enabled: boolean | null;
  is_verified: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type ContactMethodListProps = {
  contacts: ContactMethod[];
};

/**
 * Muestra estado entendible para el dueño.
 */
function getStatusLabel(contact: ContactMethod): string {
  if (!contact.is_enabled) {
    return "Oculto";
  }

  if (!contact.is_verified) {
    return "Pendiente de aprobar";
  }

  return "Visible en ContactHub";
}

/**
 * Define clases visuales del estado.
 */
function getStatusClassName(contact: ContactMethod): string {
  if (!contact.is_enabled) {
    return "border-gray-200 bg-gray-50 text-gray-700";
  }

  if (!contact.is_verified) {
    return "border-yellow-200 bg-yellow-50 text-yellow-800";
  }

  return "border-green-200 bg-green-50 text-green-800";
}

export function ContactMethodList({ contacts }: ContactMethodListProps) {
  if (contacts.length === 0) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Métodos guardados</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no hay métodos de contacto. Agrega al menos uno activo y
          aprobado para que después pueda aparecer en la landing.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          ContactHub
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Métodos guardados
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Solo los métodos activos y aprobados aparecerán después en preview y
          landing pública.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {contacts.map((contact) => (
          <article
            key={contact.id}
            className="rounded-xl border bg-background p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="font-semibold">
                  {contact.label || getContactTypeLabel(contact.type)}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {getContactTypeLabel(contact.type)} · {contact.value}
                </p>

                {contact.url ? (
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    URL: {contact.url}
                  </p>
                ) : null}
              </div>

              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${getStatusClassName(
                  contact,
                )}`}
              >
                {getStatusLabel(contact)}
              </span>
            </div>

            <form action={updateContactMethod} className="mt-5 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={contact.id} />

              <div>
                <label
                  htmlFor={`type-${contact.id}`}
                  className="block text-sm font-medium"
                >
                  Tipo
                </label>

                <select
                  id={`type-${contact.id}`}
                  name="type"
                  defaultValue={contact.type}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                >
                  {CONTACT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`label-${contact.id}`}
                  className="block text-sm font-medium"
                >
                  Etiqueta
                </label>

                <input
                  id={`label-${contact.id}`}
                  name="label"
                  defaultValue={contact.label ?? ""}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label
                  htmlFor={`value-${contact.id}`}
                  className="block text-sm font-medium"
                >
                  Valor
                </label>

                <input
                  id={`value-${contact.id}`}
                  name="value"
                  defaultValue={contact.value ?? ""}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label
                  htmlFor={`url-${contact.id}`}
                  className="block text-sm font-medium"
                >
                  URL
                </label>

                <input
                  id={`url-${contact.id}`}
                  name="url"
                  defaultValue={contact.url ?? ""}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Si cambias el valor o URL, el método volverá a no aprobado.
                </p>
              </div>

              <div>
                <label
                  htmlFor={`sort_order-${contact.id}`}
                  className="block text-sm font-medium"
                >
                  Orden
                </label>

                <input
                  id={`sort_order-${contact.id}`}
                  name="sort_order"
                  type="number"
                  min="0"
                  defaultValue={contact.sort_order ?? 0}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div className="flex flex-col justify-center gap-3 rounded-xl border bg-muted/30 p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    name="is_enabled"
                    type="checkbox"
                    defaultChecked={Boolean(contact.is_enabled)}
                    className="mt-1"
                  />

                  <span>
                    <span className="font-medium">Activo</span>
                    <span className="block text-muted-foreground">
                      Permite mostrar este método si está aprobado.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    name="is_verified"
                    type="checkbox"
                    defaultChecked={Boolean(contact.is_verified)}
                    className="mt-1"
                  />

                  <span>
                    <span className="font-medium">Aprobado/verificado</span>
                    <span className="block text-muted-foreground">
                      Confirmo que este contacto puede mostrarse públicamente.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            <form action={deleteContactMethod} className="mt-3">
              <input type="hidden" name="id" value={contact.id} />

              <button
                type="submit"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Eliminar método
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
