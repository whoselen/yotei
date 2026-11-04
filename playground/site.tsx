import { ArrowRight, Bug, Check, Copy, Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import { version } from "../package.json";
import { cn } from "../src/ui/utils";

const links = {
  github: "https://github.com/whoselen/yotei",
  docs: "https://github.com/whoselen/yotei#readme",
  issues: "https://github.com/whoselen/yotei/issues",
  npm: "https://www.npmjs.com/package/react-schedule-time-picker",
  x: "https://x.com/whoslen123",
};

// lucide has no brand marks, so these are drawn here
const GitHubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const NpmIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
  </svg>
);

const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const iconButton =
  "grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={iconButton}
    >
      {children}
    </a>
  );
}

const SocialLinks = () => (
  <>
    <IconLink href={links.github} label="GitHub">
      <GitHubIcon className="size-4.5" />
    </IconLink>
    <IconLink href={links.npm} label="npm">
      <NpmIcon className="size-4" />
    </IconLink>
    <IconLink href={links.x} label="X (Twitter)">
      <XIcon className="size-4" />
    </IconLink>
  </>
);

export function SiteNav({
  theme,
  onThemeChange,
}: {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}) {
  return (
    <nav className="flex h-16 items-center justify-between gap-4">
      <a href="#" className="flex items-baseline gap-2">
        <span className="text-base font-semibold">予定</span>
        <span className="text-sm font-medium text-muted-foreground">yotei</span>
      </a>
      <div className="flex items-center gap-1">
        <SocialLinks />
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          aria-label={theme === "dark" ? "Light theme" : "Dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
          onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          className={iconButton}
        >
          {theme === "dark" ? (
            <Sun className="size-4.5" />
          ) : (
            <Moon className="size-4.5" />
          )}
        </button>
      </div>
    </nav>
  );
}

const installs = {
  npm: "npm install react-schedule-time-picker",
  pnpm: "pnpm add react-schedule-time-picker",
  yarn: "yarn add react-schedule-time-picker",
  bun: "bun add react-schedule-time-picker",
  shadcn:
    "npx shadcn@latest add https://raw.githubusercontent.com/whoselen/yotei/main/playground/public/r/schedule-picker.json",
};

const installTabs = Object.keys(installs) as Array<keyof typeof installs>;

function Install() {
  const [tab, setTab] = useState<keyof typeof installs>("npm");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="w-full max-w-2xl rounded-xl border bg-muted/50">
      <div role="tablist" className="flex gap-4 border-b px-4">
        {installTabs.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={option === tab}
            onClick={() => setTab(option)}
            className={cn(
              "-mb-px border-b-2 py-2 text-xs font-medium transition-colors",
              option === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option === "shadcn" ? "shadcn/ui" : option}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 py-2 pr-2 pl-4">
        <code className="min-w-0 flex-1 overflow-x-auto py-1 font-mono text-[13px] whitespace-nowrap">
          <span className="text-muted-foreground select-none">$ </span>
          {installs[tab]}
        </code>
        <button
          type="button"
          aria-label="Copy command"
          title="Copy command"
          onClick={() =>
            navigator.clipboard.writeText(installs[tab]).then(() => setCopied(true))
          }
          className={cn(iconButton, "size-8 shrink-0")}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="flex flex-col items-start gap-6 pt-10 pb-14 sm:pt-16">
      <a
        href={links.npm}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        v{version} on npm
      </a>
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          react-schedule-time-picker
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          A date &amp; time picker for React that only picks the future. Past
          days, hours and minutes are disabled and cleared as the clock moves.
          Built for sending later, reminders, bookings and meetings.
        </p>
      </div>
      <Install />
      <div className="flex flex-wrap gap-2">
        <a
          href={links.docs}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Read the docs
          <ArrowRight className="size-4" />
        </a>
        <a
          href={links.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          <GitHubIcon className="size-4" />
          Star on GitHub
        </a>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 flex flex-col gap-3 border-t py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        MIT licensed. Made by{" "}
        <a
          href={links.x}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          @whoslen123
        </a>
        .
      </p>
      {/* pulled left when stacked, so the first icon lines up with the text */}
      <div className="-ml-2.5 flex items-center gap-1 sm:ml-0">
        <SocialLinks />
        <IconLink href={links.issues} label="Report an issue">
          <Bug className="size-4.5" />
        </IconLink>
      </div>
    </footer>
  );
}
