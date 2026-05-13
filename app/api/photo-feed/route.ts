import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { PublicPhotoProduct } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({
      ok: true,
      items: [],
      message: "Photo feed storage is not configured yet."
    });
  }

  const { data, error } = await supabaseAdmin
    .from("photo_analyses")
    .select("id, product_name, price, source_label, condition, deal_score, recommendation, created_at, expires_at, image_paths")
    .eq("visible_in_search", true)
    .eq("moderation_status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    return NextResponse.json({ ok: false, items: [], message: error.message }, { status: 500 });
  }

  const items: PublicPhotoProduct[] = await Promise.all(
    (data ?? []).map(async (item) => {
      return {
        id: item.id,
        title: item.product_name,
        price: typeof item.price === "number" ? item.price : Number(item.price),
        sourceLabel: item.source_label ?? undefined,
        condition: item.condition ?? undefined,
        verdict: item.recommendation,
        dealScore: item.deal_score,
        createdAt: item.created_at,
        expiresAt: item.expires_at
      };
    })
  );

  return NextResponse.json({
    ok: true,
    items,
    message: items.length > 0 ? `Showing ${items.length} recent photo-analyzed products.` : "No approved photo uploads are live right now."
  });
}
