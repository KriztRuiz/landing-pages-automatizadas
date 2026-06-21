"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Estado que el formulario recibirá después de intentar guardar.
 *
 * ok:
 * - true si se guardó correctamente.
 * - false si hubo error.
 *
 * message:
 * - texto general para mostrar al usuario.
 *
 * errors:
 * - errores específicos por campo.
 */
export type BusinessFormState = {
  ok: boolean;
  message: string;
  errors?: {
    name?: string;
    slug?: string;
    category?: string;
    short_description?: string;
    location_url?: string;
    general?: string;
  };
};

/**
 * Estructura limpia y validada antes de guardar en Supabase.
 *
 * Estos campos deben coincidir con columnas existentes en public.businesses.
 */
type ValidBusinessData = {
  name: string;
  slug: string;
  category: string;
  short_description: string;
  long_description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  location_url: string | null;
  opening_hours: string | null;
  services: string[];
  visual_mode: "classic" | "modern" | "compact";
};

/**
 * Obtiene texto limpio desde FormData.
 *
 * FormData puede traer null, File u otros valores.
 * Para este formulario solo queremos strings limpios.
 */
function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/**
 * Normaliza un texto para convertirlo en slug seguro.
 *
 * Ejemplo:
 * "Taquería El Primo" -> "taqueria-el-primo"
 *
 * Este slug más adelante se usará para:
 * /b/taqueria-el-primo
 */
function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Convierte un textarea en arreglo de servicios.
 *
 * El dueño escribirá un servicio por línea:
 *
 * Tacos de bistec
 * Tacos de trompo
 * Servicio a domicilio
 *
 * Y se guardará como:
 * ["Tacos de bistec", "Tacos de trompo", "Servicio a domicilio"]
 */
function parseServices(value: string): string[] {
  return value
    .split("\n")
    .map((service) => service.trim())
    .filter(Boolean);
}

/**
 * Valida una URL opcional.
 *
 * location_url no es obligatorio.
 * Pero si el usuario lo llena, debe ser http o https.
 */
function isValidOptionalUrl(value: string | null): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Asegura que visual_mode solo use los valores permitidos.
 *
 * Esto evita mandar datos inválidos a Supabase.
 */
function normalizeVisualMode(value: string): "classic" | "modern" | "compact" {
  if (value === "modern") return "modern";
  if (value === "compact") return "compact";

  return "classic";
}

/**
 * Lee, limpia y valida todos los campos del formulario.
 *
 * Por ahora no usamos librerías extra.
 * Mantenemos el PMV simple y fácil de entender.
 */
function validateBusinessForm(formData: FormData): {
  data?: ValidBusinessData;
  errors?: BusinessFormState["errors"];
} {
  const name = getText(formData, "name");

  /**
   * Si el usuario no escribe slug, lo generamos desde el nombre.
   * Esto hace el formulario más fácil para dueños no técnicos.
   */
  const rawSlug = getText(formData, "slug") || name;
  const slug = normalizeSlug(rawSlug);

  const category = getText(formData, "category");
  const short_description = getText(formData, "short_description");
  const long_description = getText(formData, "long_description") || null;
  const address = getText(formData, "address") || null;
  const city = getText(formData, "city") || null;
  const state = getText(formData, "state") || null;
  const country = getText(formData, "country") || "México";
  const location_url = getText(formData, "location_url") || null;
  const opening_hours = getText(formData, "opening_hours") || null;
  const services = parseServices(getText(formData, "services"));
  const visual_mode = normalizeVisualMode(getText(formData, "visual_mode"));

  const errors: BusinessFormState["errors"] = {};

  if (name.length < 2) {
    errors.name = "El nombre del negocio es obligatorio.";
  }

  if (!slug) {
    errors.slug = "El slug es obligatorio.";
  }

  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "El slug solo puede usar minúsculas, números y guiones.";
  }

  if (!category) {
    errors.category = "La categoría es obligatoria.";
  }

  if (short_description.length < 10) {
    errors.short_description =
      "La descripción corta debe tener al menos 10 caracteres.";
  }

  if (short_description.length > 160) {
    errors.short_description =
      "La descripción corta no debe pasar de 160 caracteres.";
  }

  if (!isValidOptionalUrl(location_url)) {
    errors.location_url = "El enlace de ubicación debe ser una URL válida.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
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
    },
  };
}

/**
 * Server Action para guardar negocio.
 *
 * Esta función se ejecuta en el servidor.
 *
 * Flujo:
 * 1. Revisa sesión.
 * 2. Valida formulario.
 * 3. Busca si el usuario ya tiene negocio.
 * 4. Si existe, actualiza.
 * 5. Si no existe, crea.
 */
export async function saveBusiness(
  _previousState: BusinessFormState,
  formData: FormData,
): Promise<BusinessFormState> {
  const supabase = await createClient();

  /**
   * Leemos los claims del usuario autenticado.
   *
   * En Supabase, el ID del usuario viene en claims.sub.
   */
  const { data, error: claimsError } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (claimsError || !userId) {
    return {
      ok: false,
      message: "Debes iniciar sesión para guardar tu negocio.",
      errors: {
        general: "Sesión no válida.",
      },
    };
  }

  const validation = validateBusinessForm(formData);

  if (validation.errors || !validation.data) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      errors: validation.errors,
    };
  }

  /**
   * Como ya agregamos UNIQUE(owner_id), cada usuario solo puede tener un negocio.
   * Aun así buscamos primero para decidir entre update o insert.
   */
  const { data: existingBusiness, error: readError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (readError) {
    return {
      ok: false,
      message: "No se pudo revisar si ya tienes un negocio.",
      errors: {
        general: readError.message,
      },
    };
  }

  const now = new Date().toISOString();

  if (existingBusiness) {
    /**
     * Actualizamos solo el negocio del usuario autenticado.
     *
     * La condición owner_id = userId refuerza la seguridad además de RLS.
     */
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        ...validation.data,
        updated_at: now,
      })
      .eq("id", existingBusiness.id)
      .eq("owner_id", userId);

    if (updateError) {
      return {
        ok: false,
        message:
          updateError.code === "23505"
            ? "Ese slug ya está usado por otro negocio."
            : "No se pudo actualizar el negocio.",
        errors: {
          general: updateError.message,
        },
      };
    }
  } else {
    /**
     * Creamos el negocio del usuario.
     *
     * No mandamos photos porque tu tabla ya tiene:
     * default = '{}'::text[]
     *
     * No publicamos todavía:
     * is_published = false
     */
    const { error: insertError } = await supabase.from("businesses").insert({
      ...validation.data,
      owner_id: userId,
      is_published: false,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      return {
        ok: false,
        message:
          insertError.code === "23505"
            ? "Ese slug ya está usado por otro negocio."
            : "No se pudo crear el negocio.",
        errors: {
          general: insertError.message,
        },
      };
    }
  }

  /**
   * Revalidamos las rutas que dependen de estos datos.
   * Así Next puede mostrar la información actualizada.
   */
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard/preview");

  return {
    ok: true,
    message: "Negocio guardado correctamente.",
  };
}

/**
 * Tipo mínimo del negocio para validar publicación.
 *
 * No necesitamos cargar todos los campos del negocio.
 * Solo los campos obligatorios para decidir si la landing puede hacerse pública.
 */
type BusinessPublicationData = {
  id: string;
  name: string | null;
  slug: string | null;
  category: string | null;
  short_description: string | null;
};

/**
 * Valida que el negocio cumpla los requisitos mínimos para publicar.
 *
 * Esta validación vive en el servidor porque no debemos confiar solo
 * en botones o mensajes del frontend.
 */
function getPublicationMissingFields(
  business: BusinessPublicationData | null,
  activeVerifiedContactsCount: number,
): string[] {
  const missingFields: string[] = [];

  if (!business) {
    missingFields.push("negocio registrado");
    return missingFields;
  }

  if (!business.name?.trim()) {
    missingFields.push("nombre");
  }

  if (!business.slug?.trim()) {
    missingFields.push("slug");
  }

  if (
    business.slug &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(business.slug)
  ) {
    missingFields.push("slug válido");
  }

  if (!business.category?.trim()) {
    missingFields.push("categoría");
  }

  if (!business.short_description?.trim()) {
    missingFields.push("descripción corta");
  }

  if (activeVerifiedContactsCount < 1) {
    missingFields.push("al menos un contacto activo y aprobado");
  }

  return missingFields;
}

/**
 * Publica la landing del negocio del usuario autenticado.
 *
 * Flujo:
 * 1. Revisa sesión.
 * 2. Busca el negocio del usuario.
 * 3. Cuenta contactos activos y verificados.
 * 4. Valida datos mínimos.
 * 5. Cambia is_published a true.
 */
export async function publishBusiness(): Promise<void> {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/auth/login");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, category, short_description")
    .eq("owner_id", userId)
    .maybeSingle<BusinessPublicationData>();

  if (businessError) {
    redirect("/dashboard?publication=error");
  }

  if (!business) {
    redirect("/dashboard?publication=no-business");
  }

  const { count, error: contactsError } = await supabase
    .from("contact_methods")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("is_enabled", true)
    .eq("is_verified", true);

  if (contactsError) {
    redirect("/dashboard?publication=error");
  }

  const activeVerifiedContactsCount = count ?? 0;

  const missingFields = getPublicationMissingFields(
    business,
    activeVerifiedContactsCount,
  );

  if (missingFields.length > 0) {
    redirect("/dashboard?publication=missing");
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("businesses")
    .update({
      is_published: true,
      updated_at: now,
    })
    .eq("id", business.id)
    .eq("owner_id", userId);

  if (updateError) {
    redirect("/dashboard?publication=error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/preview");

  if (business.slug) {
    revalidatePath(`/b/${business.slug}`);
  }

  redirect("/dashboard?publication=published");
}

/**
 * Despublica la landing del negocio del usuario autenticado.
 *
 * No borra datos.
 * Solo cambia is_published a false para que la URL pública deje de mostrarse.
 */
export async function unpublishBusiness(): Promise<void> {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/auth/login");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("owner_id", userId)
    .maybeSingle<{ id: string; slug: string | null }>();

  if (businessError) {
    redirect("/dashboard?publication=error");
  }

  if (!business) {
    redirect("/dashboard?publication=no-business");
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("businesses")
    .update({
      is_published: false,
      updated_at: now,
    })
    .eq("id", business.id)
    .eq("owner_id", userId);

  if (updateError) {
    redirect("/dashboard?publication=error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/preview");

  if (business.slug) {
    revalidatePath(`/b/${business.slug}`);
  }

  redirect("/dashboard?publication=unpublished");
}
