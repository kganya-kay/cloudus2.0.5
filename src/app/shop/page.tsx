import { HydrateClient, api } from "~/trpc/server";
import AllShopItems from "../_components/allShopItems";
import { Button, PageHeader } from "~/components/os/primitives";

export default async function ShopPage() {
  const initialItems = await api.shopItem.getAll().catch(() => []);

  return (
    <HydrateClient>
      <div className="space-y-6">
        <PageHeader
          title="Shop"
          actions={<Button href="/projects/create" variant="secondary">Custom</Button>}
        />
        <AllShopItems initialItems={initialItems} />
      </div>
    </HydrateClient>
  );
}
