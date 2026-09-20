import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, KeyRound, LayoutGrid } from "lucide-react";
import { haloGradient } from "@/lib/axiom/halo";
import { useChairSession, useStudioSession } from "@/lib/axiom/store";
import type { HaloMood, HaloTheme } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

type HaloCtx = {
  theme: HaloTheme;
  mood: HaloMood;
  setTheme: (theme: HaloTheme) => void;
  setMood: (mood: HaloMood) => void;
};

const HaloContext = createContext<HaloCtx | null>(null);

export function HaloProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<HaloTheme>("spectrum");
  const [mood, setMood] = useState<HaloMood>("idle");
  const value = useMemo(() => ({ theme, mood, setTheme, setMood }), [theme, mood]);
  return <HaloContext.Provider value={value}>{children}</HaloContext.Provider>;
}

export function useHalo() {
  const ctx = useContext(HaloContext);
  if (!ctx) throw new Error("HaloProvider missing");
  return ctx;
}

export function useHaloTheme(theme: HaloTheme) {
  const { setTheme } = useHalo();
  useEffect(() => {
    setTheme(theme);
    return () => setTheme("spectrum");
  }, [theme, setTheme]);
}

export function useHaloMood(mood: HaloMood) {
  const { setMood } = useHalo();
  useEffect(() => {
    setMood(mood);
    return () => setMood("idle");
  }, [mood, setMood]);
}

function HaloRing() {
  const { theme, mood } = useHalo();
  const gradient = haloGradient(theme);
  return (
    <div className="halo-shell" data-mood={mood} aria-hidden="true">
      <div className="halo-bloom" style={{ background: gradient }} />
      <div className="halo-line" style={{ background: gradient }} />
    </div>
  );
}

function navClass(active: boolean) {
  return cn(
    "flex h-12 flex-col items-center justify-center gap-0.5 rounded-sm text-xs font-medium transition-colors duration-quick",
    active ? "text-foreground" : "text-subtle",
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const factoryOn = pathname === "/" || pathname.startsWith("/discover");
  const bookedOn = pathname === "/booked" || pathname.startsWith("/booked/");
  const deskOn =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/chair") ||
    pathname.startsWith("/keys");

  return (
    <nav className="grid grid-cols-3 border-t border-border bg-background px-1 py-1">
      <Link to="/" className={navClass(factoryOn)}>
        <LayoutGrid className="size-4" strokeWidth={factoryOn ? 2.2 : 1.7} />
        Factory
      </Link>
      <Link to="/booked" className={navClass(bookedOn)}>
        <CalendarDays className="size-4" strokeWidth={bookedOn ? 2.2 : 1.7} />
        Booked
      </Link>
      <Link to="/admin" search={{ new: undefined, niche: undefined }} className={navClass(deskOn)}>
        <KeyRound className="size-4" strokeWidth={deskOn ? 2.2 : 1.7} />
        Desk
      </Link>
    </nav>
  );
}

export function AxiomShell({ children }: { children: ReactNode }) {
  const hydrate = useStudioSession((s) => s.hydrate);
  const hydrateChair = useChairSession((s) => s.hydrate);
  useEffect(() => {
    hydrate();
    hydrateChair();
  }, [hydrate, hydrateChair]);

  return (
    <div className="phone-stage">
      <div className="phone-shell">
        <HaloRing />
        <div className="absolute inset-3 flex flex-col overflow-hidden rounded-xl bg-background">
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
