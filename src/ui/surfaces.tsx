"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useParts } from "./config";

/** Keeps hidden panels out of the tab order (works on React 18 and 19) */
export function useInert(ref: RefObject<HTMLElement | null>, inert: boolean) {
  useEffect(() => {
    ref.current?.toggleAttribute("inert", inert);
  }, [ref, inert]);
}

/**
 * Whether a closing element should still be rendered: true until the exit
 * transitions it is running finish -- however long your CSS makes them. With
 * no CSS (or reduced motion) it hides right away, so the picker works unstyled.
 */
export function usePresence(ref: RefObject<HTMLElement | null>, open: boolean) {
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);

  useEffect(() => {
    if (open) return;
    let cancelled = false;
    // getAnimations() flushes styles, so the exit transition already exists here
    const animations = ref.current?.getAnimations?.() ?? [];
    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!cancelled) setPresent(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ref, open]);

  return present;
}

/** Calls `onPress` on a pointer press outside `ref` while `active` */
export function useOutsidePress(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onPress: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const handle = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onPress();
    };
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [ref, active, onPress]);
}

export type Side = "top" | "bottom";

/** Open below the trigger unless it would overflow and there's more room above */
export function pickSide(trigger: HTMLElement | null, panelHeight: number): Side {
  if (!trigger) return "bottom";
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom;
  return below < panelHeight + 12 && rect.top > below ? "top" : "bottom";
}

const hiddenStyle = { display: "none" } as const;

// Panels mount their content only while shown. It's built from the current
// time, which server HTML and the browser don't agree on (clock or time zone),
// so a closed picker hydrates cleanly -- and a page of pickers stays light.

/** The original's inline panel: grows open in place, pushing content down */
export function Collapse({ open, id, children }: { open: boolean; id?: string; children: ReactNode }) {
  const { cls } = useParts();
  const ref = useRef<HTMLDivElement>(null);
  useInert(ref, !open);
  const present = usePresence(ref, open);

  return (
    <div
      ref={ref}
      id={id}
      data-state={open ? "open" : "closed"}
      className={cls("collapse")}
      style={present ? undefined : hiddenStyle}
    >
      <div>
        <div className={cls("panel")}>{present && children}</div>
      </div>
    </div>
  );
}

/** Floats over the page, anchored to the root of the picker */
export function Popover({
  open,
  side,
  align,
  id,
  label,
  children,
}: {
  open: boolean;
  side: Side;
  align: "start" | "end";
  id?: string;
  label?: string;
  children: ReactNode;
}) {
  const { cls } = useParts();
  const ref = useRef<HTMLDivElement>(null);
  useInert(ref, !open);
  const present = usePresence(ref, open);

  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-label={label}
      data-state={open ? "open" : "closed"}
      data-side={side}
      data-align={align}
      className={cls("popover")}
      style={present ? undefined : hiddenStyle}
    >
      <div className={cls("panel")}>{present && children}</div>
    </div>
  );
}
