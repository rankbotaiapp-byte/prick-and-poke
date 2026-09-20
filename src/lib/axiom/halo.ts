import type { HaloTheme } from "./types";

export const HALO_THEMES: Record<HaloTheme, string[]> = {
  spectrum: ["#5ce1e6", "#7a6cff", "#ff5c8a", "#ff8a4c", "#f0c05a", "#4dffb4"],
  ember: ["#ffb070", "#ff6a3d", "#c43c22", "#ffd19a", "#ff8a4c", "#8a2a12"],
  ink: ["#7ad4ff", "#6a7dff", "#e8eaff", "#3ee0e8", "#9aa4ff", "#f4f4ff"],
  solstice: ["#f0c05a", "#7d9b7a", "#e07a3d", "#f4e2b8", "#c45c4a", "#5a7a4a"],
};

export const HALO_THEME_LIST: HaloTheme[] = ["spectrum", "ember", "ink", "solstice"];

const HEX = /^#([0-9a-fA-F]{6})$/;

export function isHaloTheme(value: string): value is HaloTheme {
  return value === "spectrum" || value === "ember" || value === "ink" || value === "solstice";
}

export function sanitizeHaloColors(input: unknown): string[] | null {
  if (!input) return null;
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? (() => {
          try {
            return JSON.parse(input) as unknown;
          } catch {
            return null;
          }
        })()
      : null;
  if (!Array.isArray(raw)) return null;
  const colors = raw
    .filter((c): c is string => typeof c === "string" && HEX.test(c.trim()))
    .map((c) => c.trim().toLowerCase())
    .slice(0, 6);
  return colors.length >= 2 ? colors : null;
}

export function resolveHaloColors(theme: HaloTheme, custom?: string[] | null): string[] {
  return custom && custom.length >= 2 ? custom : HALO_THEMES[theme];
}

export function haloGradientFrom(colors: string[]): string {
  const stops = colors.length ? colors : HALO_THEMES.spectrum;
  return `conic-gradient(from var(--halo-angle), ${stops.join(", ")}, ${stops[0]})`;
}

export function haloBeadFrom(colors: string[]): string {
  const hot = colors[0] ?? "#5ce1e6";
  return `conic-gradient(from var(--halo-angle), transparent 0 78%, ${hot} 86%, #ffffff 90%, ${hot} 94%, transparent 100%)`;
}

export function haloGradient(theme: HaloTheme, custom?: string[] | null): string {
  return haloGradientFrom(resolveHaloColors(theme, custom));
}
