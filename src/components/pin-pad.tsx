import { useState } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinPad({
  onComplete,
  disabled,
}: {
  onComplete: (pin: string) => void;
  disabled?: boolean;
}) {
  const [digits, setDigits] = useState("");

  function press(key: string) {
    if (disabled) return;
    if (key === "del") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (!key || digits.length >= 4) return;
    const next = digits + key;
    setDigits(next);
    if (next.length === 4) {
      onComplete(next);
      setTimeout(() => setDigits(""), 200);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3" aria-label="PIN digits">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-2.5 rounded-full border border-border transition-colors duration-quick",
              i < digits.length ? "bg-accent border-accent" : "bg-transparent",
            )}
          />
        ))}
      </div>
      <div className="grid w-full max-w-xs grid-cols-3 gap-2">
        {KEYS.map((key, i) => {
          if (key === "") return <span key={`empty-${i}`} />;
          if (key === "del") {
            return (
              <Button
                key="del"
                type="button"
                variant="ghost"
                className="h-14"
                onClick={() => press("del")}
                disabled={disabled}
                aria-label="Delete"
              >
                <Delete className="size-5" />
              </Button>
            );
          }
          return (
            <Button
              key={key}
              type="button"
              variant="secondary"
              className="h-14 font-display text-lg"
              onClick={() => press(key)}
              disabled={disabled}
            >
              {key}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
