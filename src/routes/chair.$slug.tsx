import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ImageField, PortraitField } from "@/components/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addProofShot,
  getChair,
  removeProofShot,
  updateChairBlock,
  type ProofShot,
} from "@/lib/axiom/crew";
import { useChairSession } from "@/lib/axiom/store";

export const Route = createFileRoute("/chair/$slug")({
  component: ChairPage,
});

function ChairPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const session = useChairSession((s) => s.session);
  const leave = useChairSession((s) => s.leave);
  const hydrate = useChairSession((s) => s.hydrate);
  const ready = useChairSession((s) => s.ready);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!ready) return null;
  if (!session || session.slug !== slug) {
    void navigate({ to: "/admin" });
    return null;
  }

  return (
    <ChairDesk
      slug={slug}
      memberId={session.memberId}
      pin={session.pin}
      onLeave={() => {
        leave();
        void navigate({ to: "/admin" });
      }}
    />
  );
}

function ChairDesk({
  slug,
  memberId,
  pin,
  onLeave,
}: {
  slug: string;
  memberId: number;
  pin: string;
  onLeave: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [proofs, setProofs] = useState<ProofShot[]>([]);
  const [caption, setCaption] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await getChair({ data: { slug, memberId, pin } });
    setName(data.member.displayName);
    setRole(data.member.role);
    setBio(data.member.bio);
    setAvailable(data.member.available);
    setImage(data.member.image);
    setProofs(data.proofs);
  }

  useEffect(() => {
    void load().catch((err) => toast.error(err instanceof Error ? err.message : "Chair locked"));
  }, [slug, memberId, pin]);

  async function saveBlock() {
    setBusy(true);
    try {
      await updateChairBlock({
        data: { slug, memberId, pin, displayName: name, role, bio, available, image },
      });
      toast.success("Your block is live");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function addShot() {
    if (!shot) {
      toast.error("Pick a cut photo first");
      return;
    }
    setBusy(true);
    try {
      await addProofShot({ data: { slug, memberId, pin, image: shot, caption } });
      setShot(null);
      setCaption("");
      await load();
      toast.success("Newest cut is now the lead on your block");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add");
    } finally {
      setBusy(false);
    }
  }

  const lead = proofs[0];

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Chair</p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-display">{name || "Your block"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Newest cut becomes the lead photo customers see first.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onLeave}>Lock</Button>
      </div>
      <PortraitField label="Block photo" name={name} value={image} onChange={setImage} />
      <div className="flex flex-col gap-1.5">
        <Label>Name on the block</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Role / skills</Label>
        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Skin fades · shears · beard" maxLength={40} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Bio</Label>
        <Input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={180} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        Taking books
      </label>
      <Button onClick={() => void saveBlock()} disabled={busy}>Save block</Button>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Proof album</p>
        <p className="mt-1 text-sm text-muted-foreground">
          After shot. Tight on the cut. Dark behind. Caption is the name of the work — Skin fade, not a pitch.
        </p>
        {lead ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <img src={lead.image} alt="" className="aspect-[4/5] w-full object-cover" />
            <p className="px-3 py-2 text-xs text-subtle">Lead on the shop card · {lead.caption || "untitled"}</p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-col gap-3">
          <ImageField label="New cut" value={shot} onChange={setShot} />
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Skin fade" maxLength={80} />
          <Button variant="secondary" onClick={() => void addShot()} disabled={busy}>Add to album</Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {proofs.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-md border border-border bg-card">
              <img src={item.image} alt="" className="aspect-square w-full object-cover" />
              <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                <span className="truncate text-muted-foreground">{item.caption || "Cut"}</span>
                <button type="button" className="text-subtle" onClick={() => void removeProofShot({ data: { slug, memberId, pin, id: item.id } }).then(load)}>Remove</button>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </main>
  );
}
