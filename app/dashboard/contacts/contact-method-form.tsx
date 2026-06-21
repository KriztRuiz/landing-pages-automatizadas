"use client";

/**
 * Archivo afectado:
 * app/dashboard/contacts/contact-method-form.tsx
 *
 * Formulario cliente para agregar un nuevo método de contacto.
 *
 * Es componente cliente porque usa useActionState:
 * - manda el formulario a una Server Action;
 * - recibe mensaje de éxito/error;
 * - muestra feedback al dueño del negocio.
 */

import { useActionState } from "react";

import { createContactMethod, type ContactMethodFormState } from "./actions";
import { CONTACT_TYPE_OPTIONS } from "./contact-method-types";

const initialState: ContactMethodFormState = {
  ok: false,
  message: "",
  errors: {},
};

export function ContactMethodForm() {
  const [state, formAction, isPending] = useActionState(
    createContactMethod,
    initialState,
  );

  return (
    <form action={formAction} className="rounded-2xl border bg-card p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Nuevo método
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Agregar contacto
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Agrega solo datos proporcionados, autorizados o verificados por el
          dueño del negocio.
        </p>
      </div>

      {state.message ? (
        <div
          className={`mt-5 rounded-lg border p-4 text-sm ${
            state.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="font-medium">{state.message}</p>

          {state.errors?.general ? (
            <p className="mt-2 text-xs">{state.errors.general}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Tipo de contacto *
          </label>

          <select
            id="type"
            name="type"
            defaultValue="whatsapp"
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          >
            {CONTACT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {state.errors?.type ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.type}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="label" className="block text-sm font-medium">
            Etiqueta visible
          </label>

          <input
            id="label"
            name="label"
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            placeholder="Ej. WhatsApp, Llamar, Ver menú"
          />

          {state.errors?.label ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.label}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium">
            Valor *
          </label>

          <input
            id="value"
            name="value"
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            placeholder="Ej. 8180000000, contacto@negocio.com o usuario"
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Para teléfono/WhatsApp puedes escribir 10 dígitos. El sistema
            agregará 52 automáticamente.
          </p>

          {state.errors?.value ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.value}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium">
            URL manual
          </label>

          <input
            id="url"
            name="url"
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            placeholder="Opcional. Ej. https://..."
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Úsala sobre todo para sitio web o enlaces personalizados.
          </p>

          {state.errors?.url ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.url}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium">
            Orden
          </label>

          <input
            id="sort_order"
            name="sort_order"
            type="number"
            min="0"
            defaultValue="0"
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Menor número aparece primero.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 rounded-xl border bg-muted/30 p-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              name="is_enabled"
              type="checkbox"
              defaultChecked
              className="mt-1"
            />

            <span>
              <span className="font-medium">Activo</span>
              <span className="block text-muted-foreground">
                Puede aparecer en ContactHub si también está aprobado.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <input
              name="is_verified"
              type="checkbox"
              defaultChecked
              className="mt-1"
            />

            <span>
              <span className="font-medium">Aprobado/verificado</span>
              <span className="block text-muted-foreground">
                Confirmo que este contacto pertenece al negocio y puede
                mostrarse públicamente.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar método"}
        </button>
      </div>
    </form>
  );
}
