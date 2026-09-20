export type Niche = "barber" | "tattoo" | "food_truck";

export type HaloTheme = "spectrum" | "ember" | "ink" | "solstice";

export type HaloMood = "idle" | "focus" | "confirm";

export type OfferingKind = "service" | "menu";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Hours = {
  tz: string;
  days: Record<string, string | null>;
};

export type BusinessCard = {
  id: string;
  name: string;
  niche: Niche;
  tagline: string;
  haloTheme: HaloTheme;
  haloColors: string[] | null;
  locationName: string;
  locationNote: string;
  locationUpdatedAt: string | null;
  hoursJson: string;
  heroImage: string | null;
};

export type TeamMember = {
  id: number;
  displayName: string;
  role: string;
  bio: string;
  available: boolean;
  sortOrder: number;
  image: string | null;
};

export type Offering = {
  id: number;
  memberId: number | null;
  title: string;
  description: string;
  durationMin: number;
  priceCents: number;
  image: string | null;
  kind: OfferingKind;
};

export type Post = {
  id: number;
  body: string;
  image: string | null;
  createdAt: string;
};

export type TakenSlot = {
  slotAt: string;
  memberId: number | null;
};

export type BusinessProfile = BusinessCard & {
  about: string;
  team: TeamMember[];
  offerings: Offering[];
  posts: Post[];
  takenSlots: TakenSlot[];
};

export type StudioBooking = {
  id: number;
  memberId: number | null;
  offeringId: number | null;
  guestHandle: string;
  slotAt: string;
  status: BookingStatus;
  code: string;
  note: string;
  createdAt: string;
  offeringTitle: string | null;
  memberName: string | null;
};

export type GroundFlag = {
  code: string;
  detail: string;
};

export type AxiomReceipt = {
  id: number;
  question: string;
  draft: string;
  spoken: string;
  flags: GroundFlag[];
  status: "clean" | "corrected";
  createdAt: string;
};

export type LedgerTruth = {
  id: number;
  truth: string;
  createdAt: string;
};

export type StudioPayload = BusinessProfile & {
  bookings: StudioBooking[];
  receipts: AxiomReceipt[];
  ledger: LedgerTruth[];
};

export type GuestBooking = {
  code: string;
  slug: string;
  businessName: string;
  offeringTitle: string;
  slotAt: string;
  guestHandle: string;
};
