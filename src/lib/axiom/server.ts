import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { slugify } from "./format";
import { catalogBlock, groundReply, ledgerLine, pickOffering, speakOffering } from "./ground";
import { DEFAULT_HOURS, FOOD_HOURS, isOpenAt, parseHours } from "./hours";
import { isHaloTheme } from "./halo";
import { isNiche, NICHES } from "./niches";
import { assertPinShape, hashPin } from "./pin";
import { ensureSeed } from "./seed";
import type {
  AxiomReceipt,
  BookingStatus,
  BusinessCard,
  BusinessProfile,
  GroundFlag,
  HaloTheme,
  LedgerTruth,
  Niche,
  Offering,
  OfferingKind,
  Post,
  StudioBooking,
  StudioPayload,
  TakenSlot,
  TeamMember,
} from "./types";

const HANDLE_RE = /^[A-Za-z][A-Za-z0-9 .'-]{1,23}$/;

function text(value: unknown, max: number, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} is required`);
  const next = value.trim();
  if (!next) throw new Error(`${label} is required`);
  if (next.length > max) throw new Error(`${label} is too long`);
  return next;
}

function optionalText(value: unknown, max: number): string {
  if (value == null || value === "") return "";
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function optionalImage(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error("Invalid image");
  if (value.startsWith("/")) return value;
  if (!value.startsWith("data:image/")) throw new Error("Invalid image");
  if (value.length > 180_000) throw new Error("Image is too large");
  return value;
}

function intOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) throw new Error("Invalid id");
  return n;
}

function moneyCents(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new Error("Invalid price");
  return Math.round(n);
}

function duration(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 5 || n > 480) throw new Error("Invalid duration");
  return n;
}

function bookingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "AX-";
  for (let i = 0; i < 4; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function parseFlags(raw: string): GroundFlag[] {
  try {
    const parsed = JSON.parse(raw) as GroundFlag[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((f) => f && typeof f.code === "string" && typeof f.detail === "string");
  } catch {
    return [];
  }
}

async function ensureLoopTables(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    create table if not exists axiom_receipts (
      id serial primary key,
      business_id text not null references businesses(id) on delete cascade,
      question text not null,
      draft text not null default '',
      spoken text not null,
      flags_json text not null default '[]',
      status text not null default 'clean',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create table if not exists axiom_ledger (
      id serial primary key,
      business_id text not null references businesses(id) on delete cascade,
      truth text not null,
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(
    `create index if not exists axiom_receipts_biz_idx on axiom_receipts (business_id, created_at desc)`,
  );
  await sql.query(`create index if not exists axiom_ledger_biz_idx on axiom_ledger (business_id)`);
}

async function requirePin(slug: string, pin: string) {
  const sql = await getSql();
  assertPinShape(pin);
  const rows = await sql<{ pinHash: string; name: string }>`
    select pin_hash as "pinHash", name from businesses where id = ${slug}
  `;
  const row = rows[0];
  if (!row || row.pinHash !== (await hashPin(slug, pin))) {
    throw new Error("PIN does not match this studio");
  }
  return { sql, name: row.name };
}

async function loadTeam(sql: Awaited<ReturnType<typeof getSql>>, slug: string) {
  return sql<TeamMember>`
    select id,
      display_name as "displayName",
      role, bio, available,
      sort_order as "sortOrder"
    from team_members
    where business_id = ${slug}
    order by sort_order asc, id asc
  `;
}

async function loadOfferings(sql: Awaited<ReturnType<typeof getSql>>, slug: string) {
  return sql<Offering>`
    select id,
      member_id as "memberId",
      title, description,
      duration_min as "durationMin",
      price_cents as "priceCents",
      image, kind
    from offerings
    where business_id = ${slug}
    order by id asc
  `;
}

async function loadPosts(sql: Awaited<ReturnType<typeof getSql>>, slug: string) {
  return sql<Post>`
    select id, body, image, created_at::text as "createdAt"
    from posts
    where business_id = ${slug}
    order by created_at desc
    limit 12
  `;
}

async function loadTaken(sql: Awaited<ReturnType<typeof getSql>>, slug: string) {
  return sql<TakenSlot>`
    select slot_at::text as "slotAt", member_id as "memberId"
    from bookings
    where business_id = ${slug}
      and status <> 'cancelled'
      and slot_at >= now() - interval '1 hour'
  `;
}

async function loadProfile(slug: string): Promise<BusinessProfile | null> {
  const sql = await getSql();
  await ensureSeed(sql);
  const biz = await sql<BusinessCard & { about: string }>`
    select id, name, niche, tagline, about,
      halo_theme as "haloTheme",
      location_name as "locationName",
      location_note as "locationNote",
      location_updated_at::text as "locationUpdatedAt",
      hours_json as "hoursJson"
    from businesses
    where id = ${slug}
  `;
  const card = biz[0];
  if (!card) return null;
  const [team, offerings, posts, takenSlots] = await Promise.all([
    loadTeam(sql, slug),
    loadOfferings(sql, slug),
    loadPosts(sql, slug),
    loadTaken(sql, slug),
  ]);
  return {
    ...card,
    niche: card.niche as Niche,
    haloTheme: card.haloTheme as HaloTheme,
    team,
    offerings,
    posts,
    takenSlots,
  };
}

export const listBusinesses = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  await ensureSeed(sql);
  const rows = await sql<BusinessCard>`
    select id, name, niche, tagline,
      halo_theme as "haloTheme",
      location_name as "locationName",
      location_note as "locationNote",
      location_updated_at::text as "locationUpdatedAt",
      hours_json as "hoursJson"
    from businesses
    order by created_at asc
  `;
  return rows.map((row) => ({
    ...row,
    niche: row.niche as Niche,
    haloTheme: row.haloTheme as HaloTheme,
  }));
});

export const getBusiness = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => ({ slug: text(input.slug, 64, "Studio") }))
  .handler(async ({ data }) => loadProfile(data.slug));

export const createBooking = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    memberId?: number | null;
    offeringId: number;
    guestHandle: string;
    slotAt: string;
    note?: string;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    memberId: intOrNull(input.memberId ?? null),
    offeringId: intOrNull(input.offeringId) ?? (() => { throw new Error("Choose an offering"); })(),
    guestHandle: text(input.guestHandle, 24, "Handle"),
    slotAt: text(input.slotAt, 40, "Time"),
    note: optionalText(input.note, 80),
  }))
  .handler(async ({ data }) => {
    if (!HANDLE_RE.test(data.guestHandle)) {
      throw new Error("Use a short handle — letters first, no email");
    }
    if (data.note.includes("@")) {
      throw new Error("Keep the note short and without contact details");
    }
    const slot = new Date(data.slotAt);
    if (Number.isNaN(slot.getTime())) throw new Error("Invalid time");
    if (slot.getTime() < Date.now() - 60_000) throw new Error("That time has already passed");
    const slotIso = slot.toISOString();

    const sql = await getSql();
    const offering = await sql<{ id: number; title: string; memberId: number | null }>`
      select id, title, member_id as "memberId"
      from offerings
      where id = ${data.offeringId} and business_id = ${data.slug}
    `;
    if (!offering[0]) throw new Error("Offering not found");
    const memberId = offering[0].memberId ?? data.memberId;

    const taken = await sql.query<{ id: number }>(
      `select id from bookings
       where business_id = $1
         and slot_at = $2::timestamptz
         and status <> 'cancelled'
         and member_id is not distinct from $3`,
      [data.slug, slotIso, memberId],
    );
    if (taken[0]) throw new Error("That time is already held");

    const code = bookingCode();
    const inserted = await sql.query<{ code: string }>(
      `insert into bookings (
        business_id, member_id, offering_id, guest_handle, slot_at, status, code, note
      ) values ($1, $2, $3, $4, $5::timestamptz, 'pending', $6, $7)
      returning code`,
      [data.slug, memberId, data.offeringId, data.guestHandle, slotIso, code, data.note],
    );
    const row = inserted[0]!;
    const biz = await sql<{ name: string }>`select name from businesses where id = ${data.slug}`;
    return {
      code: row.code,
      slotAt: slotIso,
      offeringTitle: offering[0].title,
      businessName: biz[0]?.name ?? data.slug,
      guestHandle: data.guestHandle,
      slug: data.slug,
    };
  });

export const lookupBooking = createServerFn({ method: "GET" })
  .validator((input: { code: string }) => ({
    code: text(input.code, 16, "Code").toUpperCase(),
  }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      code: string;
      slotAt: string;
      status: BookingStatus;
      guestHandle: string;
      businessName: string;
      offeringTitle: string | null;
      slug: string;
    }>`
      select b.code, b.slot_at::text as "slotAt", b.status,
        b.guest_handle as "guestHandle",
        s.name as "businessName",
        o.title as "offeringTitle",
        b.business_id as slug
      from bookings b
      join businesses s on s.id = b.business_id
      left join offerings o on o.id = b.offering_id
      where b.code = ${data.code}
    `;
    return rows[0] ?? null;
  });

export const askAxiom = createServerFn({ method: "POST" })
  .validator((input: { slug: string; question: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    question: text(input.question, 240, "Question"),
  }))
  .handler(async ({ data }) => {
    if (data.question.includes("@")) {
      throw new Error("Keep the question about the work, not contact");
    }
    const profile = await loadProfile(data.slug);
    if (!profile) return { ok: false as const, error: "Studio not found" };
    const sql = await getSql();
    try {
      await ensureLoopTables(sql);
    } catch {
      // Book still answers even if the receipt tables are mid-migrate.
    }

    let ledger: string[] = [];
    try {
      const ledgerRows = await sql<{ truth: string }>`
        select truth from axiom_ledger where business_id = ${data.slug} order by id asc
      `;
      ledger = ledgerRows.map((r) => r.truth);
    } catch {
      ledger = [];
    }

    const catalog = {
      name: profile.name,
      offerings: profile.offerings,
      team: profile.team,
      ledger,
      openNow: isOpenAt(parseHours(profile.hoursJson), new Date()),
    };
    const fallbackPick = pickOffering(data.question, profile.offerings);
    const groundedFallback = fallbackPick
      ? speakOffering(fallbackPick)
      : "The book is empty. Hold a listed offering when the studio adds one.";

    const probe = groundReply(data.question, "", catalog);
    const skipModel = probe.flags.length > 0;
    let draft = skipModel ? "" : groundedFallback;
    const apiKey = process.env.XAI_API_KEY;

    if (!skipModel && apiKey) {
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(3500),
          body: JSON.stringify({
            model: "grok-4.5",
            max_tokens: 80,
            messages: [
              {
                role: "system",
                content:
                  "You are Axiom. Two short sentences. No emoji. Recommend one offering by exact title and exact price from the catalog. Never invent work, prices, people, hours, or discounts. After hours is book-only. Never repeat a price or promise that is not on the book.",
              },
              {
                role: "user",
                content: `${catalogBlock(catalog)}\n\nGuest: ${data.question}`,
              },
            ],
          }),
        });
        if (res.ok) {
          const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const textOut = body.choices?.[0]?.message?.content?.trim();
          if (textOut) draft = textOut;
        }
      } catch {
        draft = groundedFallback;
      }
    }

    const grounded = groundReply(data.question, draft, catalog);

    try {
      const existing = await sql<{ truth: string }>`
        select truth from axiom_ledger where business_id = ${data.slug}
      `;
      const have = new Set(existing.map((r) => r.truth));
      for (const flag of grounded.flags) {
        const truth = ledgerLine(flag);
        if (have.has(truth)) continue;
        have.add(truth);
        await sql`
          insert into axiom_ledger (business_id, truth)
          values (${data.slug}, ${truth})
        `;
      }
      await sql`
        insert into axiom_receipts (business_id, question, draft, spoken, flags_json, status)
        values (
          ${data.slug},
          ${data.question},
          ${draft},
          ${grounded.spoken},
          ${JSON.stringify(grounded.flags)},
          ${grounded.status}
        )
      `;
    } catch {
      // Guest still hears the grounded line.
    }

    const match = profile.offerings.find((o) =>
      grounded.spoken.toLowerCase().includes(o.title.toLowerCase()),
    );
    return { ok: true as const, text: grounded.spoken, offeringTitle: match?.title ?? null };
  });

export const verifyStudio = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
  }))
  .handler(async ({ data }) => {
    const { name } = await requirePin(data.slug, data.pin);
    return { ok: true as const, name, slug: data.slug };
  });

export const getStudio = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await ensureLoopTables(sql);
    const profile = await loadProfile(data.slug);
    if (!profile) throw new Error("Studio not found");
    const bookings = await sql<StudioBooking>`
      select b.id,
        b.member_id as "memberId",
        b.offering_id as "offeringId",
        b.guest_handle as "guestHandle",
        b.slot_at::text as "slotAt",
        b.status, b.code, b.note,
        b.created_at::text as "createdAt",
        o.title as "offeringTitle",
        m.display_name as "memberName"
      from bookings b
      left join offerings o on o.id = b.offering_id
      left join team_members m on m.id = b.member_id
      where b.business_id = ${data.slug}
      order by b.slot_at desc
      limit 80
    `;
    let ledger: LedgerTruth[] = [];
    let receiptRows: {
      id: number;
      question: string;
      draft: string;
      spoken: string;
      flagsJson: string;
      status: "clean" | "corrected";
      createdAt: string;
    }[] = [];
    try {
      ledger = await sql<LedgerTruth>`
        select id, truth, created_at::text as "createdAt"
        from axiom_ledger
        where business_id = ${data.slug}
        order by id desc
        limit 40
      `;
      receiptRows = await sql<{
        id: number;
        question: string;
        draft: string;
        spoken: string;
        flagsJson: string;
        status: "clean" | "corrected";
        createdAt: string;
      }>`
        select id, question, draft, spoken,
          flags_json as "flagsJson",
          status,
          created_at::text as "createdAt"
        from axiom_receipts
        where business_id = ${data.slug}
        order by created_at desc
        limit 40
      `;
    } catch {
      ledger = [];
      receiptRows = [];
    }
    const receipts: AxiomReceipt[] = receiptRows.map((row) => ({
      id: row.id,
      question: row.question,
      draft: row.draft,
      spoken: row.spoken,
      flags: parseFlags(row.flagsJson),
      status: row.status,
      createdAt: row.createdAt,
    }));
    const payload: StudioPayload = { ...profile, bookings, receipts, ledger };
    return payload;
  });

export const createStudio = createServerFn({ method: "POST" })
  .validator((input: { name: string; niche: string; pin: string; tagline?: string }) => ({
    name: text(input.name, 48, "Name"),
    niche: text(input.niche, 24, "Niche"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    tagline: optionalText(input.tagline, 80),
  }))
  .handler(async ({ data }) => {
    if (!isNiche(data.niche)) throw new Error("Choose a niche");
    const sql = await getSql();
    await ensureSeed(sql);
    let slug = slugify(data.name);
    const clash = await sql<{ id: string }>`select id from businesses where id = ${slug}`;
    if (clash[0]) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const pinHash = await hashPin(slug, data.pin);
    const hours = data.niche === "food_truck" ? FOOD_HOURS : DEFAULT_HOURS;
    const halo = NICHES[data.niche].halo;
    const tagline = data.tagline || "Book through the night.";
    await sql`
      insert into businesses (
        id, name, niche, tagline, about, pin_hash, hours_json, halo_theme
      ) values (
        ${slug}, ${data.name}, ${data.niche}, ${tagline}, '',
        ${pinHash}, ${JSON.stringify(hours)}, ${halo}
      )
    `;
    await sql`
      insert into posts (business_id, body)
      values (${slug}, ${"Studio is live. Customize the halo, the team, and tonight's book."})
    `;
    return { slug };
  });

export const updateStudio = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    pin: string;
    name: string;
    tagline: string;
    about: string;
    haloTheme: string;
    hoursJson: string;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    name: text(input.name, 48, "Name"),
    tagline: optionalText(input.tagline, 80),
    about: optionalText(input.about, 600),
    haloTheme: text(input.haloTheme, 24, "Halo"),
    hoursJson: text(input.hoursJson, 2000, "Hours"),
  }))
  .handler(async ({ data }) => {
    if (!isHaloTheme(data.haloTheme)) throw new Error("Unknown halo");
    JSON.parse(data.hoursJson);
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      update businesses
      set name = ${data.name},
          tagline = ${data.tagline},
          about = ${data.about},
          halo_theme = ${data.haloTheme},
          hours_json = ${data.hoursJson}
      where id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const setLocation = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    pin: string;
    locationName: string;
    locationNote: string;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    locationName: optionalText(input.locationName, 80),
    locationNote: optionalText(input.locationNote, 160),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      update businesses
      set location_name = ${data.locationName},
          location_note = ${data.locationNote},
          location_updated_at = now()
      where id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const addMember = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    pin: string;
    displayName: string;
    role: string;
    bio: string;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    displayName: text(input.displayName, 40, "Name"),
    role: optionalText(input.role, 40),
    bio: optionalText(input.bio, 180),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      insert into team_members (business_id, display_name, role, bio, sort_order)
      values (
        ${data.slug}, ${data.displayName}, ${data.role}, ${data.bio},
        (select coalesce(max(sort_order), 0) + 1 from team_members where business_id = ${data.slug})
      )
    `;
    return { ok: true as const };
  });

export const updateMember = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    pin: string;
    id: number;
    displayName: string;
    role: string;
    bio: string;
    available: boolean;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intOrNull(input.id) ?? (() => { throw new Error("Missing member"); })(),
    displayName: text(input.displayName, 40, "Name"),
    role: optionalText(input.role, 40),
    bio: optionalText(input.bio, 180),
    available: Boolean(input.available),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      update team_members
      set display_name = ${data.displayName},
          role = ${data.role},
          bio = ${data.bio},
          available = ${data.available}
      where id = ${data.id} and business_id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const removeMember = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; id: number }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intOrNull(input.id) ?? (() => { throw new Error("Missing member"); })(),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`delete from team_members where id = ${data.id} and business_id = ${data.slug}`;
    return { ok: true as const };
  });

export const addOffering = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    pin: string;
    memberId?: number | null;
    title: string;
    description: string;
    durationMin: number;
    priceCents: number;
    image?: string | null;
    kind: string;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    memberId: intOrNull(input.memberId ?? null),
    title: text(input.title, 48, "Title"),
    description: optionalText(input.description, 180),
    durationMin: duration(input.durationMin),
    priceCents: moneyCents(input.priceCents),
    image: optionalImage(input.image),
    kind: text(input.kind, 16, "Kind"),
  }))
  .handler(async ({ data }) => {
    const kind: OfferingKind = data.kind === "menu" ? "menu" : "service";
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      insert into offerings (
        business_id, member_id, title, description, duration_min, price_cents, image, kind
      ) values (
        ${data.slug}, ${data.memberId}, ${data.title}, ${data.description},
        ${data.durationMin}, ${data.priceCents}, ${data.image}, ${kind}
      )
    `;
    return { ok: true as const };
  });

export const updateOffering = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    pin: string;
    id: number;
    memberId?: number | null;
    title: string;
    description: string;
    durationMin: number;
    priceCents: number;
    image?: string | null;
    kind: string;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intOrNull(input.id) ?? (() => { throw new Error("Missing offering"); })(),
    memberId: intOrNull(input.memberId ?? null),
    title: text(input.title, 48, "Title"),
    description: optionalText(input.description, 180),
    durationMin: duration(input.durationMin),
    priceCents: moneyCents(input.priceCents),
    image: optionalImage(input.image),
    kind: text(input.kind, 16, "Kind"),
  }))
  .handler(async ({ data }) => {
    const kind: OfferingKind = data.kind === "menu" ? "menu" : "service";
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      update offerings
      set member_id = ${data.memberId},
          title = ${data.title},
          description = ${data.description},
          duration_min = ${data.durationMin},
          price_cents = ${data.priceCents},
          image = ${data.image},
          kind = ${kind}
      where id = ${data.id} and business_id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const removeOffering = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; id: number }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intOrNull(input.id) ?? (() => { throw new Error("Missing offering"); })(),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`delete from offerings where id = ${data.id} and business_id = ${data.slug}`;
    return { ok: true as const };
  });

export const addPost = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; body: string; image?: string | null }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    body: text(input.body, 280, "Post"),
    image: optionalImage(input.image),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      insert into posts (business_id, body, image)
      values (${data.slug}, ${data.body}, ${data.image})
    `;
    return { ok: true as const };
  });

export const removePost = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; id: number }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intOrNull(input.id) ?? (() => { throw new Error("Missing post"); })(),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`delete from posts where id = ${data.id} and business_id = ${data.slug}`;
    return { ok: true as const };
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; id: number; status: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intOrNull(input.id) ?? (() => { throw new Error("Missing booking"); })(),
    status: text(input.status, 16, "Status"),
  }))
  .handler(async ({ data }) => {
    const allowed: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowed.includes(data.status as BookingStatus)) throw new Error("Invalid status");
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      update bookings set status = ${data.status}
      where id = ${data.id} and business_id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const addLedgerTruth = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; truth: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    truth: text(input.truth, 180, "Truth"),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`
      insert into axiom_ledger (business_id, truth)
      values (${data.slug}, ${data.truth})
    `;
    return { ok: true as const };
  });

export const removeLedgerTruth = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; id: number }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intOrNull(input.id) ?? (() => { throw new Error("Missing truth"); })(),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requirePin(data.slug, data.pin);
    await sql`delete from axiom_ledger where id = ${data.id} and business_id = ${data.slug}`;
    return { ok: true as const };
  });
