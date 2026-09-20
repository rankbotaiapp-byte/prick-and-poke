import type { HaloTheme, Niche } from "./types";

export const NICHES: Record<
  Niche,
  {
    label: string;
    teamLabel: string;
    teamSingular: string;
    offeringLabel: string;
    offeringSingular: string;
    bookLabel: string;
    locationLabel: string;
    halo: HaloTheme;
    hero: string;
    askPlaceholder: string;
    deskHint: string;
    setupSteps: string[];
  }
> = {
  barber: {
    label: "Barber",
    teamLabel: "Barbers",
    teamSingular: "Barber",
    offeringLabel: "Services",
    offeringSingular: "Service",
    bookLabel: "Book a chair",
    locationLabel: "Shop",
    halo: "ember",
    hero: "/hero-barber.jpg",
    askPlaceholder: "Who’s on the chair tonight? Skin fade price…",
    deskHint: "Add each barber, their photo, and an album of cuts. Customers book a person.",
    setupSteps: [
      "Set the shop name and hours",
      "Upload the shop photo",
      "Add each barber",
      "Put a photo on their block",
      "Upload cuts into their album",
      "Give each chair a PIN",
    ],
  },
  tattoo: {
    label: "Tattoo",
    teamLabel: "Artists",
    teamSingular: "Artist",
    offeringLabel: "Work",
    offeringSingular: "Session",
    bookLabel: "Book a session",
    locationLabel: "Studio",
    halo: "ink",
    hero: "/hero-tattoo.jpg",
    askPlaceholder: "Who’s taking flash Friday? Custom consult…",
    deskHint: "Add each artist, their photo, and an album of work. Customers book a session.",
    setupSteps: [
      "Set the studio name and hours",
      "Upload the studio photo",
      "Add each artist",
      "Put a photo on their block",
      "Upload healed work and flash",
      "Give each artist a PIN",
    ],
  },
  food_truck: {
    label: "Food",
    teamLabel: "Kitchen",
    teamSingular: "Window",
    offeringLabel: "Menu",
    offeringSingular: "Plate",
    bookLabel: "Reserve a pickup",
    locationLabel: "Today's lot",
    halo: "solstice",
    hero: "/hero-truck.jpg",
    askPlaceholder: "Where are you parked? Is the chili on tonight…",
    deskHint: "Post today’s lot first. Then add plates and prices. People order pickup, not a chair.",
    setupSteps: [
      "Set the truck name",
      "Upload a photo of the truck",
      "Pin today’s lot",
      "Add each plate and price",
      "Turn pickup holds on",
      "Give the window a PIN if you want staff in Desk",
    ],
  },
};

export const NICHE_LIST: Niche[] = ["barber", "tattoo", "food_truck"];

export function isNiche(value: string): value is Niche {
  return value === "barber" || value === "tattoo" || value === "food_truck";
}
