import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const STORAGE_BUCKET = "buywise-photo-uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, message: "Supabase service role is not configured." }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("photo_analyses")
    .select("id, image_paths")
    .lte("expires_at", now)
    .eq("visible_in_search", true);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const paths = (data ?? []).flatMap((item) => (Array.isArray(item.image_paths) ? item.image_paths : []));
  if (paths.length > 0) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(paths);
  }

  const ids = (data ?? []).map((item) => item.id);
  if (ids.length > 0) {
    await supabaseAdmin
      .from("photo_analyses")
      .update({ visible_in_search: false })
      .in("id", ids);
  }

  return NextResponse.json({ ok: true, expired: ids.length, removedImages: paths.length });
}
