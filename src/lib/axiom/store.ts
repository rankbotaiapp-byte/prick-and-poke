import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuestBooking } from "./types";

type GuestState = {
  items: GuestBooking[];
  add: (item: GuestBooking) => void;
};

export const useGuestBookings = create<GuestState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set({
          items: [item, ...get().items.filter((x) => x.code !== item.code)].slice(0, 24),
        }),
    }),
    { name: "axiom-guest-books" },
  ),
);

type Session = { slug: string; pin: string };

type StudioState = {
  session: Session | null;
  ready: boolean;
  hydrate: () => void;
  enter: (slug: string, pin: string) => void;
  leave: () => void;
};

const SESSION_KEY = "axiom-studio";
const CHAIR_KEY = "axiom-chair";

export const useStudioSession = create<StudioState>((set) => ({
  session: null,
  ready: false,
  hydrate: () => {
    if (typeof window === "undefined") {
      set({ ready: true });
      return;
    }
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      set({ session: raw ? (JSON.parse(raw) as Session) : null, ready: true });
    } catch {
      set({ session: null, ready: true });
    }
  },
  enter: (slug, pin) => {
    const session = { slug, pin };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session, ready: true });
  },
  leave: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({ session: null, ready: true });
  },
}));

type ChairSession = { slug: string; memberId: number; pin: string };

type ChairState = {
  session: ChairSession | null;
  ready: boolean;
  hydrate: () => void;
  enter: (slug: string, memberId: number, pin: string) => void;
  leave: () => void;
};

export const useChairSession = create<ChairState>((set) => ({
  session: null,
  ready: false,
  hydrate: () => {
    if (typeof window === "undefined") {
      set({ ready: true });
      return;
    }
    try {
      const raw = sessionStorage.getItem(CHAIR_KEY);
      set({ session: raw ? (JSON.parse(raw) as ChairSession) : null, ready: true });
    } catch {
      set({ session: null, ready: true });
    }
  },
  enter: (slug, memberId, pin) => {
    const session = { slug, memberId, pin };
    sessionStorage.setItem(CHAIR_KEY, JSON.stringify(session));
    set({ session, ready: true });
  },
  leave: () => {
    sessionStorage.removeItem(CHAIR_KEY);
    set({ session: null, ready: true });
  },
}));
