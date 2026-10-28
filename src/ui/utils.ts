import type { ForwardedRef, Ref } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function mergeRefs<T>(...refs: Array<Ref<T> | ForwardedRef<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

/** For boolean data attributes: present when true, absent (not "false") otherwise */
export const flag = (on: boolean) => (on ? "" : undefined);
