import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { assertPinShape, hashPin } from "./pin";

export type ProofShot = {
  id: number;
  memberId: number;
  image: string;
  caption: string;
  createdAt: string;
};

export type ChairMember = {
  id: number;
  displayName: string;
  role: string;
  bio: string;
  available: boolean;
  image: string | null;
};

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

function intId(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) throw new Error("Missing member");
  return n;
}

async function hashCrewPin(slug: string, memberId: number, pin: string) {
  return hashPin(`crew:${slug}:${memberId}`, pin);
}

export async function ensureCrewSchema(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`alter table team_members add column if not exists image text`);
  await sql.query(`alter table team_members add column if not exists pin_hash text`);
  await sql.query(`
    create table if not exists proof_shots (
      id serial primary key,
      business_id text not null references businesses(id) on delete cascade,
      member_id integer not null references team_members(id) on delete cascade,
      image text not null,
      caption text not null default '',
      created_at timestamptz not null default now()
    )
  `);
}

async function requireOwner(slug: string, pin: string) {
  const sql = await getSql();
  assertPinShape(pin);
  await ensureCrewSchema(sql);
  const rows = await sql<{ pinHash: string }>`
    select pin_hash as "pinHash" from businesses where id = ${slug}
  `;
  const row = rows[0];
  if (!row || row.pinHash !== (await hashPin(slug, pin))) {
    throw new Error("PIN does not match this studio");
  }
  return sql;
}

async function requireChair(slug: string, memberId: number, pin: string) {
  const sql = await getSql();
  assertPinShape(pin);
  await ensureCrewSchema(sql);
  const rows = await sql<{ pinHash: string | null; displayName: string }>`
    select pin_hash as "pinHash", display_name as "displayName"
    from team_members
    where id = ${memberId} and business_id = ${slug}
  `;
  const row = rows[0];
  if (!row?.pinHash) throw new Error("This chair has no PIN yet — ask the owner");
  if (row.pinHash !== (await hashCrewPin(slug, memberId, pin))) {
    throw new Error("Chair PIN does not match");
  }
  return { sql, name: row.displayName };
}

export const listPublicCrew = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => ({ slug: text(input.slug, 64, "Studio") }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureCrewSchema(sql);
    const team = await sql<ChairMember>`
      select id,
        display_name as "displayName",
        role, bio, available, image
      from team_members
      where business_id = ${data.slug} and available = true
      order by sort_order asc, id asc
    `;
    const proofs = await sql<ProofShot>`
      select id, member_id as "memberId", image, caption, created_at::text as "createdAt"
      from proof_shots
      where business_id = ${data.slug}
      order by created_at desc
      limit 80
    `;
    return { team, proofs };
  });

export const listChairs = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => ({ slug: text(input.slug, 64, "Studio") }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureCrewSchema(sql);
    return sql<{ id: number; displayName: string; role: string; hasPin: boolean }>`
      select id,
        display_name as "displayName",
        role,
        (pin_hash is not null) as "hasPin"
      from team_members
      where business_id = ${data.slug}
      order by sort_order asc, id asc
    `;
  });

export const setChairPin = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; memberId: number; chairPin: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    memberId: intId(input.memberId),
    chairPin: assertPinShape(text(input.chairPin, 4, "Chair PIN")),
  }))
  .handler(async ({ data }) => {
    const sql = await requireOwner(data.slug, data.pin);
    const hash = await hashCrewPin(data.slug, data.memberId, data.chairPin);
    await sql`
      update team_members
      set pin_hash = ${hash}
      where id = ${data.memberId} and business_id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const verifyChair = createServerFn({ method: "POST" })
  .validator((input: { slug: string; memberId: number; pin: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    memberId: intId(input.memberId),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
  }))
  .handler(async ({ data }) => {
    const { name } = await requireChair(data.slug, data.memberId, data.pin);
    return { ok: true as const, name, memberId: data.memberId, slug: data.slug };
  });

export const getChair = createServerFn({ method: "POST" })
  .validator((input: { slug: string; memberId: number; pin: string }) => ({
    slug: text(input.slug, 64, "Studio"),
    memberId: intId(input.memberId),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
  }))
  .handler(async ({ data }) => {
    const { sql, name } = await requireChair(data.slug, data.memberId, data.pin);
    const members = await sql<ChairMember>`
      select id,
        display_name as "displayName",
        role, bio, available, image
      from team_members
      where id = ${data.memberId} and business_id = ${data.slug}
    `;
    const member = members[0];
    if (!member) throw new Error("Chair not found");
    const proofs = await sql<ProofShot>`
      select id, member_id as "memberId", image, caption, created_at::text as "createdAt"
      from proof_shots
      where business_id = ${data.slug} and member_id = ${data.memberId}
      order by created_at desc
      limit 36
    `;
    return { name, member, proofs };
  });

export const updateChairBlock = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    memberId: number;
    pin: string;
    displayName: string;
    role: string;
    bio: string;
    available: boolean;
    image: string | null;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    memberId: intId(input.memberId),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    displayName: text(input.displayName, 40, "Name"),
    role: optionalText(input.role, 40),
    bio: optionalText(input.bio, 180),
    available: Boolean(input.available),
    image: optionalImage(input.image),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requireChair(data.slug, data.memberId, data.pin);
    await sql`
      update team_members
      set display_name = ${data.displayName},
          role = ${data.role},
          bio = ${data.bio},
          available = ${data.available},
          image = ${data.image}
      where id = ${data.memberId} and business_id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const addProofShot = createServerFn({ method: "POST" })
  .validator((input: {
    slug: string;
    memberId: number;
    pin: string;
    image: string;
    caption?: string;
  }) => ({
    slug: text(input.slug, 64, "Studio"),
    memberId: intId(input.memberId),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    image: optionalImage(input.image) ?? (() => { throw new Error("Add a photo"); })(),
    caption: optionalText(input.caption, 80),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requireChair(data.slug, data.memberId, data.pin);
    await sql`
      insert into proof_shots (business_id, member_id, image, caption)
      values (${data.slug}, ${data.memberId}, ${data.image}, ${data.caption})
    `;
    return { ok: true as const };
  });

export const removeProofShot = createServerFn({ method: "POST" })
  .validator((input: { slug: string; memberId: number; pin: string; id: number }) => ({
    slug: text(input.slug, 64, "Studio"),
    memberId: intId(input.memberId),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    id: intId(input.id),
  }))
  .handler(async ({ data }) => {
    const { sql } = await requireChair(data.slug, data.memberId, data.pin);
    await sql`
      delete from proof_shots
      where id = ${data.id} and member_id = ${data.memberId} and business_id = ${data.slug}
    `;
    return { ok: true as const };
  });

export const ownerSetPortrait = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pin: string; memberId: number; image: string | null }) => ({
    slug: text(input.slug, 64, "Studio"),
    pin: assertPinShape(text(input.pin, 4, "PIN")),
    memberId: intId(input.memberId),
    image: optionalImage(input.image),
  }))
  .handler(async ({ data }) => {
    const sql = await requireOwner(data.slug, data.pin);
    await sql`
      update team_members
      set image = ${data.image}
      where id = ${data.memberId} and business_id = ${data.slug}
    `;
    return { ok: true as const };
  });
