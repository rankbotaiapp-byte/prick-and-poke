import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TeamPortrait } from "@/components/team-portrait";
import { Button } from "@/components/ui/button";
import { listPublicCrew } from "@/lib/axiom/crew";

export function CrewBlocks({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["crew", slug],
    queryFn: () => listPublicCrew({ data: { slug } }),
  });
  const team = query.data?.team ?? [];
  const proofs = query.data?.proofs ?? [];
  if (!team.length) return null;

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">The chair</h2>
      <div className="mt-3 flex flex-col gap-3">
        {team.map((member) => {
          const album = proofs.filter((p) => p.memberId === member.id);
          const lead = album[0];
          const rest = album.slice(1, 5);
          return (
            <div key={member.id} className="overflow-hidden rounded-lg border border-border bg-card/90">
              <div className="flex gap-3 p-3">
                <TeamPortrait name={member.displayName} image={member.image} size={56} />
                <div className="min-w-0">
                  <p className="font-medium">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  {member.bio ? <p className="mt-1 text-sm text-subtle">{member.bio}</p> : null}
                </div>
              </div>
              {lead ? (
                <Link to="/work/$slug/$id" params={{ slug, id: String(member.id) }} className="block">
                  <img src={lead.image} alt={lead.caption} className="aspect-[4/5] w-full object-cover" />
                </Link>
              ) : null}
              {rest.length > 0 ? (
                <div className="flex gap-1 p-1">
                  {rest.map((shot) => (
                    <Link key={shot.id} to="/work/$slug/$id" params={{ slug, id: String(member.id) }} className="min-w-0 flex-1">
                      <img src={shot.image} alt={shot.caption} className="aspect-square w-full rounded-sm object-cover" />
                    </Link>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2 p-3">
                <Link to="/work/$slug/$id" params={{ slug, id: String(member.id) }} className="text-xs text-subtle">
                  {album.length > 1 ? `${album.length} cuts` : album.length === 1 ? "1 cut" : "No cuts yet"}
                </Link>
                <Button asChild size="sm">
                  <Link to="/book/$slug" params={{ slug }} search={{ member: member.id }}>
                    Book {member.displayName}
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
