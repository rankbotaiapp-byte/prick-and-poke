import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDayTime } from "@/lib/axiom/format";
import { lookupBooking } from "@/lib/axiom/server";
import { useGuestBookings } from "@/lib/axiom/store";

export const Route = createFileRoute("/booked")({
  component: BookedPage,
});

function BookedPage() {
  const items = useGuestBookings((s) => s.items);
  const add = useGuestBookings((s) => s.add);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLookup() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setBusy(true);
    try {
      const found = await lookupBooking({ data: { code: trimmed } });
      if (!found) {
        toast.error("No book with that code");
        return;
      }
      add({
        code: found.code,
        slug: found.slug,
        businessName: found.businessName,
        offeringTitle: found.offeringTitle ?? "Held time",
        slotAt: found.slotAt,
        guestHandle: found.guestHandle,
      });
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Held</p>
        <h1 className="mt-1 font-display text-2xl font-medium tracking-display">Your books</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Codes live on this phone. The studio sees the handle and the time.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="AX-XXXX"
          maxLength={16}
        />
        <Button type="button" variant="secondary" onClick={onLookup} disabled={busy}>
          Find
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">No times held yet.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/discover">Find a studio</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.code} className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.code}</p>
              <p className="mt-2 font-display text-lg font-medium tracking-display">{item.businessName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.offeringTitle}</p>
              <p className="mt-2 text-sm tabular-nums text-foreground">{formatDayTime(item.slotAt)}</p>
              <p className="mt-1 text-xs text-subtle">For {item.guestHandle}</p>
              <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                <Link to="/b/$slug" params={{ slug: item.slug }}>
                  Open studio
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
