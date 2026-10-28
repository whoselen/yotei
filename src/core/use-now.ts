"use client";

import { useSyncExternalStore } from "react";

// One clock shared by every picker on the page. It ticks exactly on each
// minute boundary, and whenever the tab becomes visible again (background
// tabs throttle timers).
let current: Date | null = null;
let timeout: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const minuteOf = (date: Date) => Math.floor(date.getTime() / 60_000);

function tick() {
  current = new Date();
  listeners.forEach((listener) => listener());
  schedule();
}

function schedule() {
  clearTimeout(timeout);
  timeout = setTimeout(tick, 60_000 - (Date.now() % 60_000));
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    clearTimeout(timeout);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

function getSnapshot() {
  // read on first use, and again if the clock sat idle past a minute boundary
  const now = new Date();
  if (!current || (listeners.size === 0 && minuteOf(current) !== minuteOf(now))) current = now;
  return current;
}

/**
 * The current time, or null while server-rendering and hydrating: the server
 * can't know the browser's clock or time zone, and frameworks that prerender
 * (Next.js) reject reading the time during render.
 */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
