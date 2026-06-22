// lib/landing-visual-modes.ts

/**
 * Modos visuales permitidos para las landings.
 *
 * Estos valores deben coincidir con:
 * - la columna businesses.visual_mode
 * - el selector del dashboard
 * - la validación en actions.ts
 */
export type LandingVisualMode = "classic" | "modern" | "compact";

/**
 * Normaliza el modo visual.
 *
 * Esto protege la UI si por error llega un valor inválido desde la base de datos.
 * En ese caso usamos "classic" como modo seguro.
 */
export function normalizeLandingVisualMode(
  value: string | null | undefined,
): LandingVisualMode {
  if (value === "modern") return "modern";
  if (value === "compact") return "compact";

  return "classic";
}

/**
 * Textos visibles para mostrar el modo seleccionado.
 *
 * Esto ayuda en preview para que el dueño sepa qué estilo está viendo.
 */
export function getLandingVisualModeLabel(mode: LandingVisualMode): string {
  const labels: Record<LandingVisualMode, string> = {
    classic: "Clásico",
    modern: "Moderno",
    compact: "Compacto",
  };

  return labels[mode];
}

/**
 * Clases de Tailwind por modo visual.
 *
 * La idea es NO duplicar tres páginas.
 *
 * Usamos:
 * - mismos datos
 * - misma estructura general
 * - diferentes clases visuales
 */
export function getLandingVisualStyles(mode: LandingVisualMode) {
  if (mode === "modern") {
    return {
      page: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white",
      container: "mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8",
      previewBadge:
        "inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur",
      hero: "lp-fade-up overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-10",
      category:
        "mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950",
      title: "text-4xl font-bold tracking-tight text-white md:text-6xl",
      shortDescription: "mt-4 max-w-2xl text-lg leading-8 text-slate-200",
      section:
        "lp-fade-up rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur",
      sectionTitle: "text-xl font-bold text-white",
      mutedText: "text-slate-300",
      card: "lp-soft-interaction rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg hover:shadow-2xl",
      serviceItem:
        "lp-soft-interaction rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100",
      primaryButton:
        "lp-soft-interaction inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg hover:shadow-xl",
      secondaryButton:
        "lp-soft-interaction inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10",
      grid: "grid gap-5 md:grid-cols-2",
    };
  }

  if (mode === "compact") {
    return {
      page: "min-h-screen bg-slate-100 text-slate-950",
      container: "mx-auto max-w-3xl px-4 py-6 sm:px-6",
      previewBadge:
        "inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700",
      hero: "lp-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
      category:
        "mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700",
      title: "text-3xl font-bold tracking-tight text-slate-950 md:text-4xl",
      shortDescription: "mt-3 text-base leading-7 text-slate-700",
      section:
        "lp-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
      sectionTitle: "text-lg font-bold text-slate-950",
      mutedText: "text-slate-600",
      card: "lp-soft-interaction rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
      serviceItem:
        "lp-soft-interaction rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800",
      primaryButton:
        "lp-soft-interaction inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm",
      secondaryButton:
        "lp-soft-interaction inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-50",
      grid: "grid gap-4",
    };
  }

  return {
    page: "min-h-screen bg-slate-50 text-slate-950",
    container: "mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8",
    previewBadge:
      "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm",
    hero: "lp-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10",
    category:
      "mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700",
    title: "text-4xl font-bold tracking-tight text-slate-950 md:text-5xl",
    shortDescription: "mt-4 max-w-2xl text-lg leading-8 text-slate-700",
    section:
      "lp-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
    sectionTitle: "text-xl font-bold text-slate-950",
    mutedText: "text-slate-600",
    card: "lp-soft-interaction rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md",
    serviceItem:
      "lp-soft-interaction rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800",
    primaryButton:
      "lp-soft-interaction inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm hover:shadow-md",
    secondaryButton:
      "lp-soft-interaction inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-50",
    grid: "grid gap-5 md:grid-cols-2",
  };
}