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
 * Esto permite que:
 * - la landing pública registre métricas;
 * - la vista previa NO registre métricas falsas.
 *
 * Para mantener el PMV simple:
 * - no usamos librerías extra;
 * - no usamos estado de React;
 * - usamos <details> y <summary> para abrir/cerrar el panel.
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

type ContactHubProps = {
  /**
   * businessId es opcional porque la vista previa no debe contar clics.
   *
   * Uso correcto:
   * - Landing pública: <ContactHub businessId={business.id} contacts={contacts} />
   * - Preview: <ContactHub contacts={contacts} />
   */
  businessId?: string;
  contacts: ContactHubMethod[];
};

type ContactLinkProps = {
  businessId?: string;
  contact: ContactHubMethod;
  className: string;
  children: ReactNode;
};

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

export function ContactHub({ businessId, contacts }: ContactHubProps) {
  if (contacts.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed bg-muted/20 p-5">
        <h3 className="text-lg font-semibold">ContactHub</h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Aún no hay métodos de contacto activos y aprobados para mostrar.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Centro de contacto</h3>

        <p className="mt-2 text-sm text-muted-foreground">
          El visitante podrá elegir el canal que prefiera.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <ContactLink
              key={contact.id}
              businessId={businessId}
              contact={contact}
              className="flex items-center gap-3 rounded-xl border bg-background p-4 text-sm font-medium hover:bg-muted"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted text-base">
                {getContactIcon(contact.type)}
              </span>

              <span>
                <span className="block">
                  {contact.label || getContactTypeLabel(contact.type)}
                </span>

                <span className="block text-xs font-normal text-muted-foreground">
                  {getContactTypeLabel(contact.type)}
                </span>
              </span>
            </ContactLink>
          ))}
        </div>
      </section>

      <details className="fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border bg-background shadow-lg">
        <summary className="cursor-pointer list-none rounded-2xl bg-foreground px-5 py-4 text-center text-sm font-semibold text-background">
          Contactar
        </summary>

        <div className="space-y-3 p-4">
          <p className="text-sm font-medium">Elige un canal</p>

          {contacts.map((contact) => (
            <ContactLink
              key={contact.id}
              businessId={businessId}
              contact={contact}
              className="flex items-center gap-3 rounded-xl border p-3 text-sm font-medium hover:bg-muted"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted">
                {getContactIcon(contact.type)}
              </span>

              <span>{contact.label || getContactTypeLabel(contact.type)}</span>
            </ContactLink>
          ))}
        </div>
      </details>
    </>
  );
}