import { HydrateClient, api } from "~/trpc/server";
import AllShopItems from "../_components/allShopItems";
import { Button, PageHeader } from "~/components/os/primitives";

export default async function ShopPage() {
  await api.post.hello({ text: "from Cloudus" }).catch(() => null);

  return (
    <HydrateClient>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketplace"
          title="Shop"
          description="Packaged Cloudus services. Checkout and fulfilment stay on the existing order flow."
          actions={<Button href="/projects/create" variant="secondary">Need something custom?</Button>}
        />
        <div className="os-card p-4">
          <AllShopItems />
        </div>
      </div>
    </HydrateClient>
  );
}
