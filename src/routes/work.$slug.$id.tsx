import { createFileRoute, Link } from "@tanstack/react-router";
import { TeamPortrait } from "@/components/team-portrait";
import { Button } from "@/components/ui/button";
import { listPublicCrew } from "@/lib/axiom/crew";

export const Route = createFileRoute("/work/$slug/$id")({
  loader: ({ params }) => listPublicCrew({ data: { slug: params.slug } }),
  component: WorkPage,
});

function WorkPage() {
  const data = Route.useLoaderData();
  const { slug, id } = Route.useParams();
  const memberId = Number(id);
  const member = data.team.find((m) => m.id === memberId);
  const album = data.proofs.filter((p) => p.memberId === memberId);

  if (!member) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">That chair is not on the book.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/b/$slug" params={{ slug }}>Back</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-col pb-8">
      <div className="flex items-center gap-3 px-4 pt-6">
        <TeamPortrait name={member.displayName} image={member.image} size={64} />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Proof</p>
          <h1 className="font-display text-2xl font-medium tracking-display">{member.displayName}</h1>
          <p className="text-sm text-muted-foreground">{member.role}</p>
        </div>
      </div>
      {member.bio ? <p className="px-4 pt-3 text-sm text-subtle">{member.bio}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-px bg-border">
        {album.map((shot) => (
          <figure key={shot.id} className="bg-background">
            <img src={shot.image} alt="" className="aspect-square w-full object-cover" />
            {shot.caption ? (
              <figcaption className="px-2 py-1.5 text-xs text-muted-foreground">{shot.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {album.length === 0 ? (
        <p className="px-4 pt-8 text-sm text-muted-foreground">No cuts posted yet. The chair still takes books.</p>
      ) : null}

      <div className="sticky bottom-0 mt-6 flex flex-col gap-2 bg-background px-4 pb-4 pt-3">
        <Button asChild size="lg">
          <Link to="/book/$slug" params={{ slug }} search={{ member: member.id }}>
            Book {member.displayName}
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/b/$slug" params={{ slug }}>Back to the shop</Link>
        </Button>
      </div>
    </main>
  );
}
