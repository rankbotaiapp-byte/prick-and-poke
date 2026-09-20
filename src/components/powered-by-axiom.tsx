import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Quiet credit. Opens the Axiom page so a shop owner can get their own. */
export function PoweredByAxiom({ className }: { className?: string }) {
  return (
    <p className={cn("text-center text-[11px] tracking-wide text-subtle", className)}>
      <Link to="/axiom" className="underline-offset-4 hover:text-muted-foreground hover:underline">
        Powered by Axiom
      </Link>
    </p>
  );
}
