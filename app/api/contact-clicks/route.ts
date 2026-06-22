// app/api/contact-clicks/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isContactType } from "@/lib/contact-types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    // Validamos que el cuerpo exista.
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Solicitud inválida." },
        { status: 400 },
      );
    }

    const { businessId, contactMethodId, contactType } = body;

    // Validamos datos mínimos.
    if (
      typeof businessId !== "string" ||
      typeof contactMethodId !== "string" ||
      !isContactType(contactType)
    ) {
      return NextResponse.json(
        { ok: false, error: "Datos de clic inválidos." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Soportamos ambos nombres por compatibilidad.
    // En tu proyecto has usado NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase no está configurado." },
        { status: 500 },
      );
    }

    // Cliente público.
    // No necesitamos sesión porque el visitante puede ser anónimo.
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const userAgent = request.headers.get("user-agent");
    const referrer = request.headers.get("referer");

    // Llamamos la función segura de PostgreSQL.
    // La función valida:
    // - negocio publicado
    // - contacto habilitado
    // - contacto verificado
    // - tipo correcto
    const { error } = await supabase.rpc("register_contact_click", {
      p_business_id: businessId,
      p_contact_method_id: contactMethodId,
      p_contact_type: contactType,
      p_user_agent: userAgent,
      p_referrer: referrer,
    });

    if (error) {
      console.error("Error registrando clic:", error.message);

      return NextResponse.json(
        { ok: false, error: "No se pudo registrar el clic." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error inesperado registrando clic:", error);

    return NextResponse.json(
      { ok: false, error: "Error inesperado." },
      { status: 500 },
    );
  }
}