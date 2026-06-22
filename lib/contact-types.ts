// lib/contact-types.ts

// Lista oficial de tipos de contacto permitidos en el PMV.
// Mantener esta lista sincronizada con la validación SQL.
export const CONTACT_TYPES = [
  "phone",
  "whatsapp",
  "email",
  "facebook",
  "messenger",
  "instagram",
  "x_twitter",
  "tiktok",
  "website",
  "custom_link",
] as const;

// TypeScript convierte la lista anterior en un tipo seguro.
// Ejemplo: ContactType solo puede ser "phone", "whatsapp", etc.
export type ContactType = (typeof CONTACT_TYPES)[number];

// Etiquetas visibles para el dashboard.
// Así evitamos mostrar valores técnicos como "x_twitter".
export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  phone: "Teléfono",
  whatsapp: "WhatsApp",
  email: "Email",
  facebook: "Facebook",
  messenger: "Messenger",
  instagram: "Instagram",
  x_twitter: "X / Twitter",
  tiktok: "TikTok",
  website: "Sitio web",
  custom_link: "Enlace personalizado",
};

// Función de seguridad para validar datos que vienen del navegador.
// Aunque TypeScript ayuda en desarrollo, el navegador puede mandar cualquier cosa.
export function isContactType(value: unknown): value is ContactType {
  return (
    typeof value === "string" &&
    CONTACT_TYPES.includes(value as ContactType)
  );
}