// components/tracked-contact-link.tsx

"use client";

import type { ReactNode } from "react";
import type { ContactType } from "@/lib/contact-types";

type TrackedContactLinkProps = {
  href: string;
  businessId: string;
  contactMethodId: string;
  contactType: ContactType;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  target?: "_self" | "_blank";
};

export function TrackedContactLink({
  href,
  businessId,
  contactMethodId,
  contactType,
  children,
  className,
  ariaLabel,
  target = "_self",
}: TrackedContactLinkProps) {
  function handleClick() {
    const payload = JSON.stringify({
      businessId,
      contactMethodId,
      contactType,
    });

    // sendBeacon es ideal para métricas simples:
    // permite enviar el dato aunque el navegador esté a punto de abrir otro enlace.
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], {
        type: "application/json",
      });

      navigator.sendBeacon("/api/contact-clicks", blob);
      return;
    }

    // Respaldo para navegadores que no soporten sendBeacon.
    // keepalive ayuda a que el request sobreviva al cambio de página.
    void fetch("/api/contact-clicks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: true,
    });
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}