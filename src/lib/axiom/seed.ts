import type { Sql } from "@/lib/db";
import { BUSINESS } from "@/config/business";
import { FOOD_HOURS, DEFAULT_HOURS } from "./hours";
import { NICHES } from "./niches";
import { hashChairPin, hashPin } from "./pin";

const DEMO_PIN = "4242";
const CHAIR_PINS = ["1111", "2222", "3333"];

export async function ensureSeed(sql: Sql): Promise<void> {
  await sql.query(`alter table businesses add column if not exists hero_image text`);
  await sql.query(`alter table team_members add column if not exists pin_hash text`);
  const rows = await sql<{ n: number }>`select count(*)::int as n from businesses`;
  if ((rows[0]?.n ?? 0) > 0) {
    await backfillHeroes(sql);
    await backfillChairPins(sql);
    return;
  }

  if (BUSINESS.active) {
    await insertStudio(sql, {
      id: BUSINESS.id,
      name: BUSINESS.name,
      niche: BUSINESS.niche,
      tagline: BUSINESS.tagline,
      about: BUSINESS.about,
      halo: BUSINESS.halo,
      hours: BUSINESS.niche === "food_truck" ? FOOD_HOURS : DEFAULT_HOURS,
      locationName: BUSINESS.locationName,
      locationNote: BUSINESS.locationNote,
      team: BUSINESS.team,
      offerings: BUSINESS.offerings,
      posts: BUSINESS.posts,
      pin: BUSINESS.pin,
    });
    return;
  }

  await insertStudio(sql, {
    id: "ember-fade",
    name: "Ember Fade",
    niche: "barber",
    tagline: "The chair is waiting.",
    about:
      "A quiet barbering room on Alberta. Fades, steel, and hot cloth. Book the chair even after we lock the door — Axiom holds the time.",
    halo: "ember",
    hours: DEFAULT_HOURS,
    locationName: "Alberta Street, Portland",
    locationNote: "Walk-up chairs until six. After hours is by book only.",
    team: [
      { name: "Marcus Vale", role: "Master barber", bio: "Skin fades and quiet chairs. Twenty years in the steel." },
      { name: "Juniper Cole", role: "Texture & beard", bio: "Curls, beards, and the long cut. Soft hands, sharp lines." },
    ],
    offerings: [
      { member: 0, title: "Skin fade", description: "Tight blend, clean edge, no rush.", minutes: 45, cents: 4500, kind: "service" },
      { member: 0, title: "Hot towel shave", description: "Cloth, brush, and a close pass.", minutes: 40, cents: 4000, kind: "service" },
      { member: 1, title: "Beard sculpt", description: "Line, shape, and oil.", minutes: 25, cents: 2800, kind: "service" },
    ],
    posts: ["Two chairs open after six if you book through Axiom. Walk-ins stop at close."],
  });

  await insertStudio(sql, {
    id: "atelier-ink",
    name: "Atelier Ink",
    niche: "tattoo",
    tagline: "Stay still. We'll do the rest.",
    about:
      "Blackwork and color in a private room. Flash on the wall, custom in the book. Sessions held through the night — we confirm in the morning.",
    halo: "ink",
    hours: DEFAULT_HOURS,
    locationName: "Division, Portland",
    locationNote: "Private room. Ring the side door after hours.",
    team: [
      { name: "Sable Wren", role: "Blackwork", bio: "Moths, line, and negative space. Flash Fridays." },
      { name: "Rio Hale", role: "Color", bio: "Botanicals and saturated fields. Custom only." },
    ],
    offerings: [
      { member: 0, title: "Flash session", description: "From the wall. Small to mid.", minutes: 90, cents: 18000, kind: "service" },
      { member: 1, title: "Custom consult", description: "Draw, place, and hold the date.", minutes: 30, cents: 5000, kind: "service" },
    ],
    posts: ["Flash sheet rotated this morning. Walk the wall, then book the hour."],
  });

  await insertStudio(sql, {
    id: "solstice-kitchen",
    name: "Solstice Kitchen",
    niche: "food_truck",
    tagline: "Find us by the steam.",
    about:
      "A night kitchen on wheels. We post the lot every morning. Pre-order the plate — it will be at the window.",
    halo: "solstice",
    hours: FOOD_HOURS,
    locationName: "SE Division & 28th",
    locationNote: "The gravel lot behind the cedar fence. Look for the steam.",
    team: [{ name: "Solstice", role: "Window", bio: "Night kitchen. Chili, bao, citrus." }],
    offerings: [
      { member: 0, title: "Ember chili", description: "Deep red, citrus zest, charcoal oil.", minutes: 15, cents: 1400, kind: "menu" },
      { member: 0, title: "Night market bao", description: "Steamed, torn, pickle on the side.", minutes: 15, cents: 1300, kind: "menu" },
      { member: 0, title: "Citrus agua", description: "Lime, orange, crushed ice.", minutes: 10, cents: 500, kind: "menu" },
    ],
    posts: ["Lot is Division & 28th until 9. Pre-order through Axiom if you want it waiting."],
  });
}

type SeedStudio = {
  id: string;
  name: string;
  niche: string;
  tagline: string;
  about: string;
  halo: string;
  hours: { tz: string; days: Record<string, string | null> };
  locationName: string;
  locationNote: string;
  pin?: string;
  team: { name: string; role: string; bio: string }[];
  offerings: {
    member: number;
    title: string;
    description: string;
    minutes: number;
    cents: number;
    kind: string;
  }[];
  posts: string[];
};

async function insertStudio(sql: Sql, seed: SeedStudio): Promise<void> {
  const pinHash = await hashPin(seed.id, seed.pin || DEMO_PIN);
  const hoursJson = JSON.stringify(seed.hours);
  const hero = isNicheHero(seed.niche);
  await sql`
    insert into businesses (
      id, name, niche, tagline, about, pin_hash, hours_json, halo_theme,
      location_name, location_note, location_updated_at, hero_image
    ) values (
      ${seed.id}, ${seed.name}, ${seed.niche}, ${seed.tagline}, ${seed.about},
      ${pinHash}, ${hoursJson}, ${seed.halo}, ${seed.locationName},
      ${seed.locationNote}, now(), ${hero}
    )
  `;

  const memberIds: number[] = [];
  for (let i = 0; i < seed.team.length; i += 1) {
    const member = seed.team[i]!;
    const inserted = await sql<{ id: number }>`
      insert into team_members (business_id, display_name, role, bio, sort_order)
      values (${seed.id}, ${member.name}, ${member.role}, ${member.bio}, ${i})
      returning id
    `;
    memberIds.push(inserted[0]!.id);
  }

  for (let i = 0; i < memberIds.length; i += 1) {
    const pin = CHAIR_PINS[i];
    const memberId = memberIds[i];
    if (!pin || memberId == null) continue;
    const chairHash = await hashChairPin(seed.id, memberId, pin);
    await sql`update team_members set pin_hash = ${chairHash} where id = ${memberId}`;
  }

  for (const offering of seed.offerings) {
    const memberId = memberIds[offering.member] ?? null;
    await sql`
      insert into offerings (
        business_id, member_id, title, description, duration_min, price_cents, kind
      ) values (
        ${seed.id}, ${memberId}, ${offering.title}, ${offering.description},
        ${offering.minutes}, ${offering.cents}, ${offering.kind}
      )
    `;
  }

  for (const body of seed.posts) {
    await sql`insert into posts (business_id, body) values (${seed.id}, ${body})`;
  }
}

function isNicheHero(niche: string): string | null {
  if (niche === "barber" || niche === "tattoo" || niche === "food_truck") {
    return NICHES[niche].hero;
  }
  return null;
}

async function backfillHeroes(sql: Sql): Promise<void> {
  await sql`update businesses set hero_image = ${NICHES.barber.hero} where niche = 'barber' and (hero_image is null or hero_image = '')`;
  await sql`update businesses set hero_image = ${NICHES.tattoo.hero} where niche = 'tattoo' and (hero_image is null or hero_image = '')`;
  await sql`update businesses set hero_image = ${NICHES.food_truck.hero} where niche = 'food_truck' and (hero_image is null or hero_image = '')`;
}

async function backfillChairPins(sql: Sql): Promise<void> {
  const shops = await sql<{ id: string }>`select id from businesses`;
  for (const shop of shops) {
    const chairs = await sql<{ id: number }>`
      select id from team_members
      where business_id = ${shop.id} and pin_hash is null
      order by sort_order asc, id asc
    `;
    for (let i = 0; i < chairs.length; i += 1) {
      const pin = CHAIR_PINS[i];
      const memberId = chairs[i]?.id;
      if (!pin || memberId == null) continue;
      const chairHash = await hashChairPin(shop.id, memberId, pin);
      await sql`update team_members set pin_hash = ${chairHash} where id = ${memberId}`;
    }
  }
}
