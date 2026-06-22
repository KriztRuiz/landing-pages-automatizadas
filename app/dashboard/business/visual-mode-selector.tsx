"use client";

import { useState } from "react";

type VisualMode = "classic" | "modern" | "compact";

type VisualModeOption = {
  value: VisualMode;
  title: string;
  description: string;
  recommendedFor: string;
};

const VISUAL_MODE_OPTIONS: VisualModeOption[] = [
  {
    value: "classic",
    title: "Clásico",
    description: "Diseño limpio, serio y fácil de leer.",
    recommendedFor: "Abogados, consultorios, talleres y servicios profesionales.",
  },
  {
    value: "modern",
    title: "Moderno",
    description: "Diseño más visual, dinámico y comercial.",
    recommendedFor:
      "Restaurantes, barberías, estéticas, cafeterías y negocios con fotos.",
  },
  {
    value: "compact",
    title: "Compacto",
    description: "Diseño corto, rápido y enfocado en el contacto.",
    recommendedFor:
      "Técnicos, comida rápida, servicios a domicilio y negocios con poca información.",
  },
];

function normalizeVisualMode(value: string | null | undefined): VisualMode {
  if (value === "modern") return "modern";
  if (value === "compact") return "compact";

  return "classic";
}

type VisualModeSelectorProps = {
  currentMode?: string | null;
};

export function VisualModeSelector({ currentMode }: VisualModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<VisualMode>(
    normalizeVisualMode(currentMode),
  );

  return (
    <section className="lp-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">
          Modo visual de tu landing
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Elige cómo quieres que se vea la página pública de tu negocio. Esto no
          cambia tu información, solo la forma de presentarla.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {VISUAL_MODE_OPTIONS.map((option) => {
          const isSelected = option.value === selectedMode;

          return (
            <label
              key={option.value}
              className={[
                "lp-soft-interaction cursor-pointer rounded-2xl border p-4",
                isSelected
                  ? "border-slate-950 bg-slate-950 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-md",
              ].join(" ")}
            >
              <input
                type="radio"
                name="visual_mode"
                value={option.value}
                checked={isSelected}
                onChange={() => setSelectedMode(option.value)}
                className="sr-only"
              />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{option.title}</p>

                  <p
                    className={[
                      "mt-2 text-sm leading-5",
                      isSelected ? "text-slate-200" : "text-slate-600",
                    ].join(" ")}
                  >
                    {option.description}
                  </p>
                </div>

                <span
                  className={[
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                    isSelected
                      ? "border-white bg-white text-slate-950"
                      : "border-slate-300 text-transparent",
                  ].join(" ")}
                >
                  ✓
                </span>
              </div>

              <p
                className={[
                  "mt-4 text-xs leading-5",
                  isSelected ? "text-slate-300" : "text-slate-500",
                ].join(" ")}
              >
                Ideal para: {option.recommendedFor}
              </p>
            </label>
          );
        })}
      </div>
    </section>
  );
}