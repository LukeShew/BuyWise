"use client";

import type { SavedItem, SavedItemStatus } from "@/types";

const STORAGE_KEY = "buywise.saved-items";

function readItems(): SavedItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SavedItem[];
  } catch {
    return [];
  }
}

function writeItems(items: SavedItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getLocalSavedItems() {
  return readItems();
}

export function saveLocalItem(item: Omit<SavedItem, "id" | "createdAt">) {
  const items = readItems();
  const savedItem: SavedItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  writeItems([savedItem, ...items]);
  return savedItem;
}

export function updateLocalSavedItem(id: string, updates: Partial<SavedItem>) {
  const nextItems = readItems().map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  writeItems(nextItems);
  return nextItems;
}

export function deleteLocalSavedItem(id: string) {
  const nextItems = readItems().filter((item) => item.id !== id);
  writeItems(nextItems);
  return nextItems;
}

export function normalizeStatus(status: string): SavedItemStatus {
  const allowed: SavedItemStatus[] = ["watching", "contacted", "negotiating", "bought", "passed"];
  return allowed.includes(status as SavedItemStatus) ? (status as SavedItemStatus) : "watching";
}
