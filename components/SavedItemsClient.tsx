"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { mockProducts } from "@/data/mockProducts";
import {
  deleteLocalSavedItem,
  getLocalSavedItems,
  normalizeStatus,
  updateLocalSavedItem
} from "@/lib/savedItemsStorage";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { SavedItem, SavedItemStatus } from "@/types";
import { SavedItemCard } from "@/components/SavedItemCard";

function mapSavedRow(row: Record<string, unknown>): SavedItem {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    productId: String(row.product_id),
    askingPrice: Number(row.asking_price),
    marketplace: String(row.marketplace) as SavedItem["marketplace"],
    sellerLocation: String(row.seller_location ?? ""),
    notes: String(row.notes ?? ""),
    status: normalizeStatus(String(row.status)),
    createdAt: String(row.created_at)
  };
}

export function SavedItemsClient() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItems() {
      setLoading(true);

      if (supabase) {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);

        if (data.session) {
          const { data: rows, error: queryError } = await supabase
            .from("saved_items")
            .select("*")
            .order("created_at", { ascending: false });

          if (queryError) {
            setError(queryError.message);
          } else {
            setItems((rows ?? []).map((row) => mapSavedRow(row)));
          }

          setLoading(false);
          return;
        }
      }

      setItems(getLocalSavedItems());
      setLoading(false);
    }

    loadItems();
  }, []);

  async function handleStatusChange(id: string, status: SavedItemStatus) {
    if (supabase && session) {
      const { error: updateError } = await supabase.from("saved_items").update({ status }).eq("id", id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      return;
    }

    setItems(updateLocalSavedItem(id, { status }));
  }

  async function handleDelete(id: string) {
    if (supabase && session) {
      const { error: deleteError } = await supabase.from("saved_items").delete().eq("id", id);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      return;
    }

    setItems(deleteLocalSavedItem(id));
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-stone-600 shadow-sm">
        Loading saved items...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!session ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {isSupabaseConfigured()
            ? "You are viewing browser-saved items. Log in to sync them to your account."
            : "Supabase is not configured, so saved items are stored in this browser for now."}
        </div>
      ) : null}

      {error ? <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      {items.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-ink">No saved items yet</h2>
          <p className="mt-2 text-stone-600">
            Use the bookmark on a product card or save a verdict after analyzing a link.
          </p>
        </div>
      ) : (
        items.map((item) => (
          <SavedItemCard
            key={item.id}
            item={item}
            product={mockProducts.find((product) => product.id === item.productId)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
}
