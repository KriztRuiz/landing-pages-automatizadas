/**
 * Archivo afectado:
 * components/contact-hub.tsx
 *
 * ContactHub visual reutilizable.
 *
 * Este componente recibe métodos de contacto ya filtrados.
 * Es decir: quien lo use debe mandar solo contactos activos y aprobados.
 *
 * En Fase 7 agregamos métricas básicas:
 * - si recibe businessId, registra clics;
 * - si NO recibe businessId, solo muestra enlaces normales.
 *
 * En Fase 8 agregamos:
 * - soporte para modos visuales;
 * - panel flotante con estilos por modo;
 * - opción para ocultar el panel informativo interno.
 *
 * Esto permite que:
 * - la landing pública registre métricas;
 * - la vista previa NO registre métricas falsas;
 * - el ContactHub se adapte a classic, modern y compact;
 * - más adelante podamos agregar más modos sin reescribir el componente.
 */

import type { ReactNode } from "react";

import { TrackedContactLink } from "@/components/tracked-contact-link";
import { isContactType } from "@/lib/contact-types";

export type ContactHubMethod = {
  id: string;
  type: string | null;
  label: string | null;
  value: string | null;
  url: string | null;
};

/**
 * Modos visuales que el ContactHub entiende actualmente.
 *
 * Cuando agreguemos más modos, por ejemplo:
 * - "elegant"
 * - "restaurant"
 * - "showcase"
 *
 * solo tendremos que:
 * 1. agregar el valor aquí;
 * 2. agregar sus clases en CONTACT_HUB_STYLES;
 * 3. pasar ese modo desde la landing.
 */
export type ContactHubVisualMode = "classic" | "modern" | "compact";

type ContactHubProps = {
  /**
   * businessId es opcional porque la vista previa no debe contar clics.
   *
   * Uso correcto:
   * - Landing pública:
   *   <ContactHub businessId={business.id} contacts={contacts} />
   *
   * - Preview:
   *   <ContactHub contacts={contacts} />
   */
  businessId?: string;

  contacts: ContactHubMethod[];

  /**
   * visualMode controla cómo se ve el ContactHub.
   *
   * Si no se manda, usamos "classic" como modo seguro.
   */
  visualMode?: ContactHubVisualMode;

  /**
   * showInlinePanel controla si ContactHub muestra también
   * una tarjeta informativa dentro del flujo de la página.
   *
   * Para landing pública y preview de Fase 8 conviene usar false,
   * porque esas páginas ya tienen su propia sección "Centro de contacto".
   *
   * El botón flotante siempre se muestra si hay contactos.
   */
  showInlinePanel?: boolean;
};

type ContactLinkProps = {
  businessId?: string;
  contact: ContactHubMethod;
  className: string;
  children: ReactNode;
};

type ContactHubStyleSet = {
  emptyState: string;
  inlinePanel: string;
  inlineTitle: string;
  inlineText: string;
  inlineGrid: string;
  inlineLink: string;
  floatingDetails: string;
  floatingSummary: string;
  floatingPanel: string;
  floatingTitle: string;
  floatingLink: string;
  icon: string;
  secondaryText: string;
};

/**
 * Mapa central de estilos del ContactHub.
 *
 * Esta estructura prepara el proyecto para crecer.
 *
 * En lugar de llenar el componente con muchos if,
 * cada modo vive como un bloque de clases.
 *
 * Para agregar un nuevo modo después:
 *
 * restaurant: {
 *   emptyState: "...",
 *   inlinePanel: "...",
 *   ...
 * }
 *
 * Así el componente sigue limpio y modificable.
 */
const CONTACT_HUB_STYLES: Record<ContactHubVisualMode, ContactHubStyleSet> = {
  classic: {
    emptyState:
      "rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-slate-950 shadow-sm",
    inlinePanel:
      "rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm",
    inlineTitle: "text-lg font-semibold text-slate-950",
    inlineText: "mt-2 text-sm text-slate-600",
    inlineGrid: "mt-4 grid gap-3 sm:grid-cols-2",
    inlineLink:
      "lp-soft-interaction flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-950 hover:bg-slate-50",
    floatingDetails:
      "fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl",
    floatingSummary:
      "cursor-pointer list-none rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-semibold text-white",
    floatingPanel: "space-y-3 p-4",
    floatingTitle: "text-sm font-semibold text-slate-950",
    floatingLink:
      "lp-soft-interaction flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-950 hover:bg-slate-50",
    icon: "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-base",
    secondaryText: "text-slate-500",
  },

  modern: {
    emptyState:
      "rounded-2xl border border-white/10 bg-white/10 p-5 text-white shadow-xl backdrop-blur",
    inlinePanel:
      "rounded-2xl border border-white/10 bg-white/10 p-5 text-white shadow-xl backdrop-blur",
    inlineTitle: "text-lg font-semibold text-white",
    inlineText: "mt-2 text-sm text-slate-300",
    inlineGrid: "mt-4 grid gap-3 sm:grid-cols-2",
    inlineLink:
      "lp-soft-interaction flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-4 text-sm font-medium text-white hover:bg-white/15",
    floatingDetails:
      "fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl",
    floatingSummary:
      "cursor-pointer list-none rounded-2xl bg-white px-5 py-4 text-center text-sm font-bold text-slate-950",
    floatingPanel: "space-y-3 bg-slate-950 p-4",
    floatingTitle: "text-sm font-semibold text-white",
    floatingLink:
      "lp-soft-interaction flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 text-sm font-medium text-white hover:bg-white/15",
    icon: "flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-base",
    secondaryText: "text-slate-300",
  },

  compact: {
    emptyState:
      "rounded-xl border border-dashed border-slate-300 bg-white p-4 text-slate-950 shadow-sm",
    inlinePanel:
      "rounded-xl border border-slate-200 bg-white p-4 text-slate-950 shadow-sm",
    inlineTitle: "text-base font-semibold text-slate-950",
    inlineText: "mt-1 text-sm text-slate-600",
    inlineGrid: "mt-3 grid gap-2",
    inlineLink:
      "lp-soft-interaction flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-950 hover:bg-white",
    floatingDetails:
      "fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl",
    floatingSummary:
      "cursor-pointer list-none rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white",
    floatingPanel: "space-y-2 p-3",
    floatingTitle: "text-sm font-semibold text-slate-950",
    floatingLink:
      "lp-soft-interaction flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-950 hover:bg-slate-50",
    icon: "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-base",
    secondaryText: "text-slate-500",
  },
};

/**
 * Normaliza el modo visual.
 *
 * Esto evita que el componente truene si recibe undefined
 * o si más adelante llega un dato extraño desde la base.
 */
function getContactHubStyles(
  visualMode: ContactHubVisualMode | undefined,
): ContactHubStyleSet {
  if (visualMode === "modern") return CONTACT_HUB_STYLES.modern;
  if (visualMode === "compact") return CONTACT_HUB_STYLES.compact;

  return CONTACT_HUB_STYLES.classic;
}

/**
 * Convierte el tipo interno en una etiqueta legible.
 *
 * Ejemplo:
 * "whatsapp" -> "WhatsApp"
 */
function getContactTypeLabel(type: string | null): string {
  if (type === "phone") return "Teléfono";
  if (type === "whatsapp") return "WhatsApp";
  if (type === "email") return "Correo";
  if (type === "facebook") return "Facebook";
  if (type === "messenger") return "Messenger";
  if (type === "instagram") return "Instagram";
  if (type === "x_twitter") return "X / Twitter";
  if (type === "tiktok") return "TikTok";
  if (type === "website") return "Sitio web";
  if (type === "custom_link") return "Enlace";

  return "Contacto";
}

/**
 * Emoji temporal para hacer el ContactHub más fácil de leer.
 *
 * Más adelante podemos cambiar esto por íconos reales.
 * Por ahora evitamos agregar una librería innecesaria.
 */
function getContactIcon(type: string | null): string {
  if (type === "phone") return "📞";
  if (type === "whatsapp") return "💬";
  if (type === "email") return "✉️";
  if (type === "facebook") return "f";
  if (type === "messenger") return "💬";
  if (type === "instagram") return "📷";
  if (type === "x_twitter") return "𝕏";
  if (type === "tiktok") return "♪";
  if (type === "website") return "🌐";
  if (type === "custom_link") return "🔗";

  return "☎️";
}

/**
 * Define si el enlace debe abrir en la misma app o en una pestaña nueva.
 *
 * tel: y mailto: deben abrirse normal.
 * URLs http/https pueden abrir en otra pestaña.
 */
function getLinkTarget(url: string): "_self" | "_blank" {
  if (url.startsWith("tel:") || url.startsWith("mailto:")) {
    return "_self";
  }

  return "_blank";
}

/**
 * Renderiza un enlace de contacto.
 *
 * Caso 1:
 * Si hay businessId y el tipo de contacto es válido,
 * usamos TrackedContactLink para registrar la métrica.
 *
 * Caso 2:
 * Si NO hay businessId, usamos <a> normal.
 * Esto sirve para la vista previa y evita métricas falsas.
 */
function ContactLink({
  businessId,
  contact,
  className,
  children,
}: ContactLinkProps) {
  if (!contact.url) {
    return null;
  }

  const target = getLinkTarget(contact.url);
  const rel = target === "_blank" ? "noopener noreferrer" : undefined;

  if (businessId && isContactType(contact.type)) {
    return (
      <TrackedContactLink
        href={contact.url}
        businessId={businessId}
        contactMethodId={contact.id}
        contactType={contact.type}
        target={target}
        className={className}
      >
        {children}
      </TrackedContactLink>
    );
  }

  return (
    <a href={contact.url} target={target} rel={rel} className={className}>
      {children}
    </a>
  );
}

export function ContactHub({
  businessId,
  contacts,
  visualMode = "classic",
  showInlinePanel = true,
}: ContactHubProps) {
  const styles = getContactHubStyles(visualMode);

  if (contacts.length === 0) {
    return (
      <section className={styles.emptyState}>
        <h3 className={styles.inlineTitle}>Centro de contacto</h3>

        <p className={styles.inlineText}>
          Aún no hay métodos de contacto activos y aprobados para mostrar.
        </p>
      </section>
    );
  }

  return (
    <>
      {showInlinePanel ? (
        <section className={styles.inlinePanel}>
          <h3 className={styles.inlineTitle}>Centro de contacto</h3>

          <p className={styles.inlineText}>
            El visitante podrá elegir el canal que prefiera.
          </p>

          <div className={styles.inlineGrid}>
            {contacts.map((contact) => (
              <ContactLink
                key={contact.id}
                businessId={businessId}
                contact={contact}
                className={styles.inlineLink}
              >
                <span className={styles.icon}>
                  {getContactIcon(contact.type)}
                </span>

                <span>
                  <span className="block">
                    {contact.label || getContactTypeLabel(contact.type)}
                  </span>

                  <span
                    className={`block text-xs font-normal ${styles.secondaryText}`}
                  >
                    {getContactTypeLabel(contact.type)}
                  </span>
                </span>
              </ContactLink>
            ))}
          </div>
        </section>
      ) : null}

      <details className={styles.floatingDetails}>
        <summary className={styles.floatingSummary}>Contactar</summary>

        <div className={styles.floatingPanel}>
          <p className={styles.floatingTitle}>Elige un canal</p>

          {contacts.map((contact) => (
            <ContactLink
              key={contact.id}
              businessId={businessId}
              contact={contact}
              className={styles.floatingLink}
            >
              <span className={styles.icon}>{getContactIcon(contact.type)}</span>

              <span>{contact.label || getContactTypeLabel(contact.type)}</span>
            </ContactLink>
          ))}
        </div>
      </details>
    </>
  );
}