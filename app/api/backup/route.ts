import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TABLES = ["products", "clients", "sales", "purchases", "expenses", "accounts", "goals", "alerts"] as const;
const RETENTION_DAYS = 30;

/**
 * Respaldo automático — invocado una vez al día por el Cron Job de
 * Vercel (ver vercel.json). Exporta todas las tablas a un JSON y lo
 * sube al bucket "backups" de Supabase Storage. También borra
 * respaldos con más de RETENTION_DAYS días para no acumular espacio
 * indefinidamente.
 *
 * Protegido con CRON_SECRET: Vercel envía automáticamente el header
 * "Authorization: Bearer <CRON_SECRET>" en cada invocación programada,
 * siempre que hayas definido esa variable de entorno en el proyecto.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  try {
    const [business, rates, ...rest] = await Promise.all([
      supabase.from("business_settings").select("*").limit(1).maybeSingle(),
      supabase.from("exchange_rates").select("*").limit(1).maybeSingle(),
      ...TABLES.map((t) => supabase.from(t).select("*")),
    ]);

    const data: Record<string, unknown> = {
      business: business.data,
      rates: rates.data,
    };
    TABLES.forEach((t, i) => {
      data[t] = rest[i].data ?? [];
    });

    const backup = {
      version: "2.0-automated",
      exportDate: new Date().toISOString(),
      data,
    };

    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(filename, JSON.stringify(backup, null, 2), {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      console.error("[backup] upload failed", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Limpieza: borra respaldos más viejos que RETENTION_DAYS
    const { data: files } = await supabase.storage.from("backups").list();
    const cutoff = Date.now() - RETENTION_DAYS * 86400000;
    const toDelete = (files ?? [])
      .filter((f) => {
        const match = f.name.match(/^backup-(\d{4}-\d{2}-\d{2})\.json$/);
        if (!match) return false;
        return new Date(match[1]).getTime() < cutoff;
      })
      .map((f) => f.name);

    if (toDelete.length) {
      await supabase.storage.from("backups").remove(toDelete);
    }

    return NextResponse.json({ ok: true, filename, deleted: toDelete.length });
  } catch (err) {
    console.error("[backup] unexpected error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
