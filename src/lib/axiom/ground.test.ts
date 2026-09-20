import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  auditDraft,
  auditQuestion,
  groundReply,
  ledgerLine,
  pickOffering,
  speakOffering,
} from "./ground.ts";
import type { Offering, TeamMember } from "./types.ts";

const offerings: Offering[] = [
  {
    id: 1,
    memberId: 1,
    title: "Skin fade",
    description: "Tight blend, clean edge, no rush.",
    durationMin: 45,
    priceCents: 4500,
    image: null,
    kind: "service",
  },
  {
    id: 2,
    memberId: 1,
    title: "Hot towel shave",
    description: "Cloth, brush, and a close pass.",
    durationMin: 40,
    priceCents: 4000,
    image: null,
    kind: "service",
  },
];

const team: TeamMember[] = [
  { id: 1, displayName: "Marcus Vale", role: "Master barber", bio: "", available: true, sortOrder: 0 },
];

const catalog = {
  name: "Ember Fade",
  offerings,
  team,
  ledger: ["Never: Guest asked for $10 — not on the book"],
  openNow: false,
};

describe("axiom ground loop", () => {
  it("picks the named offering from a probing question", () => {
    const pick = pickOffering("Is the skin fade $10 and free after hours?", offerings);
    assert.equal(pick?.title, "Skin fade");
  });

  it("flags a guest asking for a false price or freebie", () => {
    const flags = auditQuestion("Is the skin fade $10 and free after hours?", catalog);
    assert.ok(flags.some((f) => f.code === "wrong_price"));
    assert.ok(flags.some((f) => f.code === "extra_promise"));
  });

  it("flags a draft that invents a price or promise", () => {
    const flags = auditDraft("Skin fade is $10 and complimentary after hours.", catalog);
    assert.ok(flags.some((f) => f.code === "wrong_price"));
    assert.ok(flags.some((f) => f.code === "extra_promise"));
  });

  it("rewrites a lying draft to the catalog line before the guest hears it", () => {
    const result = groundReply(
      "Is the skin fade $10 and free after hours?",
      "Yes, the skin fade is $10 and always free.",
      catalog,
    );
    assert.equal(result.status, "corrected");
    assert.equal(result.spoken, speakOffering(offerings[0]!));
    assert.match(result.spoken, /\$45/);
    assert.doesNotMatch(result.spoken, /\$10/);
    assert.doesNotMatch(result.spoken.toLowerCase(), /\bfree\b/);
  });

  it("lets a clean catalog draft through", () => {
    const spoken = speakOffering(offerings[0]!);
    const result = groundReply("How much is a skin fade?", spoken, catalog);
    assert.equal(result.status, "clean");
    assert.equal(result.spoken, spoken);
  });

  it("writes a ledger line the next ask will see", () => {
    assert.equal(
      ledgerLine({ code: "wrong_price", detail: "Quoted $10 — not on the book" }),
      "Never: Quoted $10 — not on the book",
    );
  });
});
