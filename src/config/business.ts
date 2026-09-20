import type { HaloTheme, Niche } from "@/lib/axiom/types";

/**
 * THIS IS THE ONLY FILE YOU EDIT TO MAKE A CLIENT SHOP.
 *
 * 1. Use this template → new repo named after the shop.
 * 2. Replace the object below (or paste Scout's business.ts over it).
 * 3. Set active: true.
 * 4. Deploy that repo. Home = this shop. Desk = /admin PIN 4242.
 *
 * id = lowercase-dashes, no spaces (new-hope-tattoos).
 * niche = "barber" | "tattoo" | "food_truck"
 * halo = "ember" | "ink" | "solstice" | "spectrum"
 * heroImage = "/hero-tattoo.jpg" is the demo faded background.
 * Owner can replace that photo in Desk.
 *
 * Do not edit the type block above the = { . Only the values.
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
  active: false,
  id: "client-studio",
  name: "Client Studio",
  niche: "barber",
  tagline: "Book through the night.",
  about: "The owner fills photos, hours, and albums in Desk.",
  halo: "ember",
  pin: "4242",
  locationName: "",
  locationNote: "",
  heroImage: "/hero-tattoo.jpg",
  team: [
    { name: "Chair 1", role: "Artist", bio: "Owner replaces this in Desk." },
    { name: "Chair 2", role: "Artist", bio: "Owner replaces this in Desk." },
  ],
  offerings: [],
  posts: [],
};
