/**
 * Archivo afectado:
 * app/dashboard/contacts/contact-method-types.ts
 *
 * Este archivo centraliza los tipos de contacto permitidos.
 * Así evitamos escribir los mismos valores en varios componentes.
 */

export const CONTACT_TYPE_OPTIONS = [
  {
    value: "phone",
    label: "Teléfono",
    example: "8180000000",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    example: "8180000000",
  },
  {
    value: "email",
    label: "Correo",
    example: "contacto@negocio.com",
  },
  {
    value: "facebook",
    label: "Facebook",
    example: "negocio.demo o https://facebook.com/negocio.demo",
  },
  {
    value: "messenger",
    label: "Messenger",
    example: "negocio.demo",
  },
  {
    value: "instagram",
    label: "Instagram",
    example: "negocio_demo",
  },
  {
    value: "x_twitter",
    label: "X / Twitter",
    example: "negocio_demo",
  },
  {
    value: "tiktok",
    label: "TikTok",
    example: "negocio_demo",
  },
  {
    value: "website",
    label: "Sitio web",
    example: "https://minegocio.com",
  },
  {
    value: "custom_link",
    label: "Enlace personalizado",
    example: "https://menu.misitioweb.com",
  },
] as const;

export type ContactMethodType = (typeof CONTACT_TYPE_OPTIONS)[number]["value"];

/**
 * Revisa si un string pertenece a los tipos permitidos.
 * Esto es útil porque FormData siempre llega como texto normal.
 */
export function isContactMethodType(value: string): value is ContactMethodType {
  return CONTACT_TYPE_OPTIONS.some((option) => option.value === value);
}

/**
 * Obtiene la etiqueta visible de un tipo de contacto.
 * Ejemplo: "whatsapp" -> "WhatsApp"
 */
export function getContactTypeLabel(type: string): string {
  return (
    CONTACT_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    "Contacto"
  );
}
