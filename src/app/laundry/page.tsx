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
        <PageHeader title="Laundry" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Partners</h2>
            <p className="os-muted mt-2">{suppliers.length}</p>
            <ul className="mt-3 space-y-2">
              {suppliers.slice(0, 4).map((supplier) => (
                <li key={supplier.id} className="text-sm">
                  {supplier.name}
                  <span className="os-muted"> · {[supplier.suburb, supplier.city].filter(Boolean).join(", ") || "—"}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">Order</h2>
          <div className="mt-4">
            <LaundryOrderClient defaultName={session?.user?.name} defaultEmail={session?.user?.email} />
          </div>
        </Card>
      </div>
    </HydrateClient>
  );
}
