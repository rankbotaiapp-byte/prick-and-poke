import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/shop-view";
import { getBusiness } from "@/lib/axiom/server";

export const Route = createFileRoute("/b/$slug")({
  loader: ({ params }) => getBusiness({ data: { slug: params.slug } }),
  component: BusinessPage,
});

function BusinessPage() {
  const business = Route.useLoaderData();
  const { slug } = Route.useParams();
  return <ShopView business={business} slug={slug} />;
}
