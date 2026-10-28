// Minimal shadcn/ui Button (outline + icon only) for the original component
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../src/ui/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline";
  size?: "default" | "icon";
}

const outline =
  "inline-flex h-9 items-center whitespace-nowrap rounded-md border border-input bg-background text-sm shadow-xs transition-[color,background-color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant: _variant, size = "default", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(outline, size === "icon" ? "w-9 justify-center" : "px-4", className)}
      {...props}
    />
  );
});
