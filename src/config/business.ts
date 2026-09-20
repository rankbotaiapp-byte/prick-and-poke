import type { HaloTheme, Niche } from "@/lib/axiom/types";

/**
 * THIS IS THE ONLY FILE YOU EDIT TO MAKE A CLIENT SHOP.
 */
export const BUSINESS: {
  active: boolean;
  id: string;
  name: string;
  niche: Niche;
  tagline: string;
  about: string;
  halo: HaloTheme;
  pin: string;
  locationName: string;
  locationNote: string;
  heroImage: string | null;
  team: { name: string; role: string; bio: string }[];
  offerings: {
    member: number;
    title: string;
    description: string;
    minutes: number;
    cents: number;
    kind: "service" | "menu";
  }[];
  posts: string[];
} = {
  active: true,
  id: "prick-and-poke",
  name: "Prick and Poke",
  niche: "tattoo",
  tagline: "Stay still. We'll do the rest.",
  about: "The owner fills hours, artists, and the album in Desk.",
  halo: "ink",
  pin: "4242",
  locationName: "",
  locationNote: "",
  heroImage: "/hero-tattoo.jpg",
  team: [
    { name: "Artist 1", role: "Artist", bio: "Owner replaces this in Desk." },
    { name: "Artist 2", role: "Artist", bio: "Owner replaces this in Desk." },
  ],
  offerings: [
    { member: 0, title: "Flash session", description: "From the wall. Small to mid.", minutes: 90, cents: 18000, kind: "service" },
    { member: 1, title: "Custom consult", description: "Draw, place, and hold the date.", minutes: 30, cents: 5000, kind: "service" },
  ],
  posts: [],
};
