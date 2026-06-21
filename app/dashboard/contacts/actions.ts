"use server";



/**

 * Archivo afectado:

 * app/dashboard/contacts/actions.ts

 *

 * Aquí viven las Server Actions de métodos de contacto.

 *

 * Las Server Actions se ejecutan en el servidor, no en el navegador.

 * Por eso aquí podemos:

 * - revisar sesión;

 * - consultar Supabase;

 * - insertar, actualizar y borrar registros;

 * - revalidar rutas después de guardar.

 */



import { revalidatePath } from "next/cache";



import { createClient } from "@/lib/supabase/server";

import {

  getContactTypeLabel,

  isContactMethodType,

  type ContactMethodType,

} from "./contact-method-types";



export type ContactMethodFormState = {

  ok: boolean;

  message: string;

  errors?: {

    type?: string;

    label?: string;

    value?: string;

    url?: string;

    general?: string;

  };

};



type BusinessRecord = {

  id: string;

  slug: string | null;

};



type ContactMethodRecord = {

  id: string;

  type: string | null;

  value: string | null;

  url: string | null;

};



/**

 * Obtiene texto limpio desde FormData.

 *

 * FormData puede traer null, File u otros valores.

 * En este formulario solo esperamos texto.

 */

function getText(formData: FormData, key: string): string {

  return String(formData.get(key) ?? "").trim();

}



/**

 * Convierte checkbox de formulario a boolean.

 *

 * En HTML:

 * - si un checkbox está marcado, FormData trae "on";

 * - si no está marcado, FormData no trae nada.

 */

function getCheckbox(formData: FormData, key: string): boolean {

  return formData.get(key) === "on";

}



/**

 * Limpia teléfono/WhatsApp dejando solo números.

 *

 * Ejemplo:

 * "+52 81 8000 0000" -> "528180000000"

 */

function normalizePhone(value: string): string {

  const digits = value.replace(/\D/g, "");



  /**

   * Para México:

   * Si el dueño escribe 10 dígitos, asumimos que falta +52.

   * Ejemplo:

   * 8180000000 -> 528180000000

   */

  if (digits.length === 10) {

    return `52${digits}`;

  }



  return digits;

}



/**

 * Revisa si una URL es http o https.

 *

 * No aceptamos javascript:, ftp:, data:, etc.

 * Esto ayuda a evitar enlaces inseguros o raros.

 */

function isValidHttpUrl(value: string): boolean {

  try {

    const url = new URL(value);



    return url.protocol === "http:" || url.protocol === "https:";

  } catch {

    return false;

  }

}



/**

 * Si el usuario escribió @usuario, quitamos @.

 *

 * Ejemplo:

 * "@mi_negocio" -> "mi_negocio"

 */

function cleanUsername(value: string): string {

  return value.replace(/^@+/, "").trim();

}



/**

 * Genera la URL final según el tipo de contacto.

 *

 * La columna value guarda el dato principal.

 * La columna url guarda el enlace final que usará el visitante.

 */

function buildContactUrl(type: ContactMethodType, value: string, url: string): string {

  if (type === "phone") {

    return `tel:+${normalizePhone(value)}`;

  }



  if (type === "whatsapp") {

    return `https://wa.me/${normalizePhone(value)}`;

  }



  if (type === "email") {

    return `mailto:${value}`;

  }



  /**

   * Si el dueño pega una URL completa en una red social,

   * respetamos esa URL.

   *

   * Si solo escribe usuario, generamos la URL.

   */

  if (["facebook", "instagram", "x_twitter", "tiktok"].includes(type)) {

    if (isValidHttpUrl(value)) {

      return value;

    }

  }



  if (type === "facebook") {

    return `https://facebook.com/${cleanUsername(value)}`;

  }



  if (type === "messenger") {

    return `https://m.me/${cleanUsername(value)}`;

  }



  if (type === "instagram") {

    return `https://instagram.com/${cleanUsername(value)}`;

  }



  if (type === "x_twitter") {

    return `https://x.com/${cleanUsername(value)}`;

  }



  if (type === "tiktok") {

    return `https://www.tiktok.com/@${cleanUsername(value)}`;

  }



  /**

   * website y custom_link necesitan una URL real.

   * Si el campo url viene lleno, usamos url.

   * Si no, usamos value.

   */

  if (type === "website" || type === "custom_link") {

    return url || value;

  }



  return url;

}



/**

 * Valida email básico.

 *

 * No buscamos una validación perfecta.

 * Solo evitamos datos claramente inválidos.

 */

function isValidEmail(value: string): boolean {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

}



/**

 * Convierte sort_order a número seguro.

 */

function parseSortOrder(value: string): number {

  const parsed = Number(value);



  if (!Number.isFinite(parsed)) {

    return 0;

  }



  return Math.max(0, Math.trunc(parsed));

}



/**

 * Lee y valida el formulario de contacto.

 *

 * Mantiene el PMV simple:

 * - no usamos librerías extra;

 * - validamos lo mínimo necesario;

 * - generamos la URL automáticamente cuando se puede.

 */

function validateContactForm(formData: FormData): {

  data?: {

    type: ContactMethodType;

    label: string;

    value: string;

    url: string;

    is_enabled: boolean;

    is_verified: boolean;

    sort_order: number;

  };

  errors?: ContactMethodFormState["errors"];

} {

  const rawType = getText(formData, "type");

  const rawLabel = getText(formData, "label");

  const rawValue = getText(formData, "value");

  const rawUrl = getText(formData, "url");

  const sortOrder = parseSortOrder(getText(formData, "sort_order"));

  const isEnabled = getCheckbox(formData, "is_enabled");

  const isVerified = getCheckbox(formData, "is_verified");



  const errors: ContactMethodFormState["errors"] = {};



  if (!isContactMethodType(rawType)) {

    errors.type = "Selecciona un tipo de contacto válido.";

  }



  if (!rawValue) {

    errors.value = "El valor del contacto es obligatorio.";

  }



  if (rawLabel.length > 60) {

    errors.label = "La etiqueta no debe pasar de 60 caracteres.";

  }



  if (rawType === "phone" || rawType === "whatsapp") {

    const phone = normalizePhone(rawValue);



    if (phone.length < 10 || phone.length > 15) {

      errors.value =

        "Escribe un teléfono válido. Ejemplo: 8180000000 o 528180000000.";

    }

  }



  if (rawType === "email" && rawValue && !isValidEmail(rawValue)) {

    errors.value = "Escribe un correo válido.";

  }



  if (

    (rawType === "website" || rawType === "custom_link") &&

    rawValue &&

    !isValidHttpUrl(rawUrl || rawValue)

  ) {

    errors.url = "El sitio web o enlace personalizado debe iniciar con http:// o https://.";

  }



  if (rawUrl && !isValidHttpUrl(rawUrl)) {

    errors.url = "La URL manual debe iniciar con http:// o https://.";

  }



  if (Object.keys(errors).length > 0 || !isContactMethodType(rawType)) {

    return { errors };

  }



  const finalLabel = rawLabel || getContactTypeLabel(rawType);

  const normalizedValue =

    rawType === "phone" || rawType === "whatsapp"

      ? normalizePhone(rawValue)

      : rawValue;



  const finalUrl = buildContactUrl(rawType, normalizedValue, rawUrl);



  return {

    data: {

      type: rawType,

      label: finalLabel,

      value: normalizedValue,

      url: finalUrl,

      is_enabled: isEnabled,

      is_verified: isVerified,

      sort_order: sortOrder,

    },

  };

}



/**

 * Obtiene el usuario actual.

 * Si no hay sesión válida, regresa null.

 */

async function getCurrentUserId() {

  const supabase = await createClient();



  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;



  if (error || !userId) {

    return {

      supabase,

      userId: null,

    };

  }



  return {

    supabase,

    userId,

  };

}



/**

 * Obtiene el negocio del usuario autenticado.

 *

 * Esto evita que alguien pueda crear contactos para negocios ajenos.

 * RLS también protege, pero este filtro deja clara la intención.

 */

async function getCurrentBusiness(userId: string): Promise<{

  business: BusinessRecord | null;

  errorMessage?: string;

}> {

  const supabase = await createClient();



  const { data: business, error } = await supabase

    .from("businesses")

    .select("id, slug")

    .eq("owner_id", userId)

    .maybeSingle<BusinessRecord>();



  if (error) {

    return {

      business: null,

      errorMessage: error.message,

    };

  }



  return {

    business,

  };

}



/**

 * Revalida las páginas que pueden depender de contactos.

 */

function revalidateContactPaths(slug?: string | null) {

  revalidatePath("/dashboard/contacts");

  revalidatePath("/dashboard/preview");



  if (slug) {

    revalidatePath(`/b/${slug}`);

  }

}



/**

 * Crear nuevo método de contacto.

 */

export async function createContactMethod(

  _previousState: ContactMethodFormState,

  formData: FormData,

): Promise<ContactMethodFormState> {

  const { supabase, userId } = await getCurrentUserId();



  if (!userId) {

    return {

      ok: false,

      message: "Debes iniciar sesión para guardar métodos de contacto.",

      errors: {

        general: "Sesión no válida.",

      },

    };

  }



  const { business, errorMessage } = await getCurrentBusiness(userId);



  if (errorMessage) {

    return {

      ok: false,

      message: "No se pudo cargar tu negocio.",

      errors: {

        general: errorMessage,

      },

    };

  }



  if (!business) {

    return {

      ok: false,

      message: "Primero registra los datos de tu negocio.",

      errors: {

        general: "No hay negocio asociado a tu cuenta.",

      },

    };

  }



  const validation = validateContactForm(formData);



  if (validation.errors || !validation.data) {

    return {

      ok: false,

      message: "Revisa los campos del contacto.",

      errors: validation.errors,

    };

  }



  const { error } = await supabase.from("contact_methods").insert({

    business_id: business.id,

    ...validation.data,

  });



  if (error) {

    return {

      ok: false,

      message: "No se pudo guardar el método de contacto.",

      errors: {

        general: error.message,

      },

    };

  }



  revalidateContactPaths(business.slug);



  return {

    ok: true,

    message: "Método de contacto guardado correctamente.",

    errors: {},

  };

}



/**

 * Actualizar método existente.

 *

 * Regla importante:

 * Si el dueño cambia type, value o url, el método vuelve a no verificado.

 * Esto evita mostrar públicamente un dato nuevo sin confirmación.

 */

export async function updateContactMethod(formData: FormData) {

  const contactMethodId = getText(formData, "id");



  if (!contactMethodId) {

    return;

  }



  const { supabase, userId } = await getCurrentUserId();



  if (!userId) {

    return;

  }



  const { business } = await getCurrentBusiness(userId);



  if (!business) {

    return;

  }



  const validation = validateContactForm(formData);



  if (validation.errors || !validation.data) {

    return;

  }



  const { data: existingContact } = await supabase

    .from("contact_methods")

    .select("id, type, value, url")

    .eq("id", contactMethodId)

    .eq("business_id", business.id)

    .maybeSingle<ContactMethodRecord>();



  if (!existingContact) {

    return;

  }



  const changedImportantData =

    existingContact.type !== validation.data.type ||

    existingContact.value !== validation.data.value ||

    existingContact.url !== validation.data.url;



  const nextIsVerified = changedImportantData

    ? false

    : validation.data.is_verified;



  await supabase

    .from("contact_methods")

    .update({

      ...validation.data,

      is_verified: nextIsVerified,

    })

    .eq("id", contactMethodId)

    .eq("business_id", business.id);



  revalidateContactPaths(business.slug);

}



/**

 * Eliminar método de contacto.

 *

 * Para el PMV esto está permitido.

 * Si más adelante queremos conservar historial de métricas,

 * podríamos cambiarlo por un borrado lógico.

 */

export async function deleteContactMethod(formData: FormData) {

  const contactMethodId = getText(formData, "id");



  if (!contactMethodId) {

    return;

  }



  const { supabase, userId } = await getCurrentUserId();



  if (!userId) {

    return;

  }



  const { business } = await getCurrentBusiness(userId);



  if (!business) {

    return;

  }



  await supabase

    .from("contact_methods")

    .delete()

    .eq("id", contactMethodId)

    .eq("business_id", business.id);



  revalidateContactPaths(business.slug);

}