import { useRef, useState } from "react";
import { HaloFrame } from "@/components/halo-frame";
import { TeamPortrait } from "@/components/team-portrait";
import { Button } from "@/components/ui/button";
import { fileToDataUrl, fileToHeroUrl, fileToPortraitUrl } from "@/lib/axiom/image";

type Props = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

export function ImageField({ label, value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToDataUrl(file));
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <HaloFrame className="size-16 shrink-0 rounded-md">
          <div className="size-16 overflow-hidden bg-muted">
            {value ? <img src={value} alt="" className="size-full object-cover" /> : null}
          </div>
        </HaloFrame>
        <div className="flex flex-col gap-1">
          <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Reading…" : value ? "Change photo" : "Add photo"}
          </Button>
          {value ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
              Clear
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export function HeroField({ label = "Hero", value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToHeroUrl(file));
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        {value ? (
          <img src={value} alt="" className="h-28 w-full object-cover" />
        ) : (
          <div className="flex h-28 items-center justify-center text-xs text-subtle">
            Chair, room, truck — the room behind the book
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Reading…" : value ? "Switch hero" : "Upload hero"}
        </Button>
        {value ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            Clear
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function PortraitField({
  label = "Photo",
  name,
  value,
  onChange,
}: Props & { name: string }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToPortraitUrl(file));
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <TeamPortrait name={name || "New"} image={value} size={72} />
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Reading…" : "Change photo"}
        </Button>
        {value ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            Clear photo
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
