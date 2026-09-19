import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { HydrateClient } from "~/trpc/server";
import { LaundryOrderClient } from "./laundry-order-client";
import { Card, PageHeader } from "~/components/os/primitives";

export default async function LaundryPage() {
  const session = await auth();
  const suppliers = await db.supplier
    .findMany({
      where: {
        isActive: true,
        OR: [
          { type: { equals: "laundry", mode: "insensitive" } },
          { type: { equals: "service", mode: "insensitive" } },
          { description: { contains: "laundry", mode: "insensitive" } },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 12,
      select: { id: true, name: true, city: true, suburb: true, pricePerKg: true },
    })
    .catch(() => []);

  return (
    <HydrateClient>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Service"
          title="Laundry"
          description="Share pickup details, pay securely, and track the order. Supplier and driver assignment is unchanged."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">What’s included</h2>
            <ul className="os-muted mt-3 space-y-2">
              <li>Wash, dry, fold, optional pressing</li>
              <li>Driver pickup and drop-off</li>
              <li>Status updates through the order</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-semibold">Partners</h2>
            <p className="os-muted mt-2">{suppliers.length} nearby suppliers</p>
            <ul className="mt-3 space-y-2">
              {suppliers.slice(0, 4).map((supplier) => (
                <li key={supplier.id} className="text-sm">
                  {supplier.name}
                  <span className="os-muted"> · {[supplier.suburb, supplier.city].filter(Boolean).join(", ") || "Area pending"}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">Place an order</h2>
          <div className="mt-4">
            <LaundryOrderClient defaultName={session?.user?.name} defaultEmail={session?.user?.email} />
          </div>
        </Card>
      </div>
    </HydrateClient>
  );
}
