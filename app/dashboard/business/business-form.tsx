"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveBusiness, type BusinessFormState } from "./actions";

/**
 * Tipo mínimo del negocio que recibiremos desde page.tsx.
 *
 * Usamos null porque algunos campos pueden venir vacíos desde Supabase.
 */
export type Business = {
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
};

type BusinessFormProps = {
  business: Business | null;
};

const initialState: BusinessFormState = {
  ok: false,
  message: "",
  errors: {},
};

const categories = [
  "Restaurante",
  "Taquería",
  "Taller mecánico",
  "Estética",
  "Barbería",
  "Abogado",
  "Consultorio",
  "Tienda local",
  "Servicio técnico",
  "Otro",
];

/**
 * Convierte arreglo de servicios a texto para el textarea.
 *
 * Supabase guarda services como text[].
 * El formulario lo muestra como texto multilínea.
 */
function servicesToText(services: Business["services"]): string {
  if (!services) return "";

  return services.join("\n");
}

/**
 * Genera un slug en el navegador para ayudar al usuario.
 *
 * El servidor también lo valida.
 * No confiamos solo en esta función porque el navegador puede manipularse.
 */
function createSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Formulario principal de Fase 3.
 *
 * Este componente es cliente porque usa:
 * - useActionState para llamar la Server Action.
 * - useState para ayudar a generar el slug.
 */
export function BusinessForm({ business }: BusinessFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveBusiness,
    initialState,
  );

  const [name, setName] = useState(business?.name ?? "");
  const [slug, setSlug] = useState(business?.slug ?? "");

  return (
    <form action={formAction} className="space-y-8">
      {state.message ? (
        <div
          className={`rounded-lg border p-4 text-sm ${
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

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Información básica</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Estos datos serán la base de la landing pública del negocio.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Nombre del negocio *
            </label>

            <input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Ej. Taquería El Primo"
            />

            {state.errors?.name ? (
              <p className="mt-1 text-sm text-red-600">{state.errors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium">
              Slug para URL *
            </label>

            <div className="mt-2 flex gap-2">
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                placeholder="taqueria-el-primo"
              />

              <button
                type="button"
                onClick={() => setSlug(createSlug(name))}
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Generar
              </button>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Más adelante se usará así: /b/{slug || "mi-negocio"}
            </p>

            {state.errors?.slug ? (
              <p className="mt-1 text-sm text-red-600">{state.errors.slug}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium">
              Categoría *
            </label>

            <select
              id="category"
              name="category"
              defaultValue={business?.category ?? ""}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="">Selecciona una categoría</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {state.errors?.category ? (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.category}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="short_description"
              className="block text-sm font-medium"
            >
              Descripción corta *
            </label>

            <input
              id="short_description"
              name="short_description"
              defaultValue={business?.short_description ?? ""}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Ej. Tacos, tortas y gringas al carbón en Sabinas Hidalgo."
            />

            {state.errors?.short_description ? (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.short_description}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="long_description"
              className="block text-sm font-medium"
            >
              Descripción larga
            </label>

            <textarea
              id="long_description"
              name="long_description"
              defaultValue={business?.long_description ?? ""}
              rows={4}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Cuenta brevemente la historia, especialidad o ventaja del negocio."
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Ubicación y atención</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Usa información proporcionada o autorizada por el dueño del negocio.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium">
              Dirección o zona de atención
            </label>

            <input
              id="address"
              name="address"
              defaultValue={business?.address ?? ""}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Ej. Centro de Sabinas Hidalgo o servicio a domicilio"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium">
              Ciudad
            </label>

            <input
              id="city"
              name="city"
              defaultValue={business?.city ?? ""}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Sabinas Hidalgo"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium">
              Estado
            </label>

            <input
              id="state"
              name="state"
              defaultValue={business?.state ?? ""}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Nuevo León"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium">
              País
            </label>

            <input
              id="country"
              name="country"
              defaultValue={business?.country ?? "México"}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </div>

          <div>
            <label htmlFor="location_url" className="block text-sm font-medium">
              Link de ubicación autorizado
            </label>

            <input
              id="location_url"
              name="location_url"
              defaultValue={business?.location_url ?? ""}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="https://..."
            />

            {state.errors?.location_url ? (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.location_url}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="opening_hours"
              className="block text-sm font-medium"
            >
              Horarios
            </label>

            <textarea
              id="opening_hours"
              name="opening_hours"
              defaultValue={business?.opening_hours ?? ""}
              rows={3}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder={`Lunes a viernes: 9:00 am - 6:00 pm\nSábado: 9:00 am - 2:00 pm`}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Servicios y estilo</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="services" className="block text-sm font-medium">
              Servicios principales
            </label>

            <textarea
              id="services"
              name="services"
              defaultValue={servicesToText(business?.services ?? null)}
              rows={5}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder={`Servicio 1\nServicio 2\nServicio 3`}
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Escribe un servicio por línea.
            </p>
          </div>

          <div>
            <label htmlFor="visual_mode" className="block text-sm font-medium">
              Modo visual
            </label>

            <select
              id="visual_mode"
              name="visual_mode"
              defaultValue={business?.visual_mode ?? "classic"}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="classic">Clásico</option>
              <option value="modern">Moderno</option>
              <option value="compact">Compacto</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar negocio"}
        </button>

        <Link
          href="/dashboard"
          className="rounded-lg border px-5 py-3 text-center text-sm font-semibold hover:bg-muted"
        >
          Volver al panel
        </Link>
      </div>
    </form>
  );
}