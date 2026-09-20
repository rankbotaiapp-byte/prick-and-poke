import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PortraitField } from "@/components/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listChairs, ownerSetPortrait, setChairPin } from "@/lib/axiom/crew";
import { useStudioSession } from "@/lib/axiom/store";

export const Route = createFileRoute("/keys/$slug")({
  component: KeysPage,
});

function KeysPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const session = useStudioSession((s) => s.session);
  const hydrate = useStudioSession((s) => s.hydrate);
  const ready = useStudioSession((s) => s.ready);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!ready) return null;
  if (!session || session.slug !== slug) {
    void navigate({ to: "/admin" });
    return null;
  }

  return <KeysDesk slug={slug} pin={session.pin} />;
}

function KeysDesk({ slug, pin }: { slug: string; pin: string }) {
  const [rows, setRows] = useState<{ id: number; displayName: string; role: string; hasPin: boolean }[]>([]);
  const [pins, setPins] = useState<Record<number, string>>({});
  const [photos, setPhotos] = useState<Record<number, string | null>>({});

  async function load() {
    setRows(await listChairs({ data: { slug } }));
  }

  useEffect(() => {
    void load();
  }, [slug]);

  return (
    <main className="flex flex-col gap-5 px-4 pb-8 pt-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Owner</p>
        <h1 className="mt-1 font-display text-2xl">Chair keys</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set each barber’s four-digit PIN and drop a photo on their block.
        </p>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="rounded-lg border border-border bg-card p-3">
          <p className="font-medium">{row.displayName}</p>
          <p className="text-xs text-muted-foreground">{row.role} · {row.hasPin ? "PIN set" : "No PIN yet"}</p>
          <div className="mt-3">
            <PortraitField label="Block photo" name={row.displayName} value={photos[row.id] ?? null} onChange={(image) => setPhotos((s) => ({ ...s, [row.id]: image }))} />
          </div>
          <Button className="mt-2" size="sm" variant="secondary" onClick={() => void ownerSetPortrait({ data: { slug, pin, memberId: row.id, image: photos[row.id] ?? null } }).then(() => toast.success("Photo on the block"))}>
            Save photo
          </Button>
          <div className="mt-3 flex gap-2">
            <Input inputMode="numeric" maxLength={4} placeholder="Chair PIN" value={pins[row.id] ?? ""} onChange={(e) => setPins((s) => ({ ...s, [row.id]: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
            <Button size="sm" onClick={() => void setChairPin({ data: { slug, pin, memberId: row.id, chairPin: pins[row.id] ?? "" } }).then(() => { toast.success("Chair PIN set"); void load(); })}>
              Set PIN
            </Button>
          </div>
        </div>
      ))}
    </main>
  );
}
