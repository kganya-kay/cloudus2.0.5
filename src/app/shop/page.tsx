import { HydrateClient, api } from "~/trpc/server";
import AllShopItems from "../_components/allShopItems";
import { Button, PageHeader } from "~/components/os/primitives";

export default async function ShopPage() {
  const initialItems = await api.shopItem.getAll().catch(() => []);

  return (
    <HydrateClient>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketplace"
          title="Shop"
          description="Browse Cloudus products and services without signing in. Login is only needed to like or check out."
          actions={<Button href="/projects/create" variant="secondary">Need something custom?</Button>}
        />
        <AllShopItems initialItems={initialItems} />
      </div>
    </HydrateClient>
  );
}
