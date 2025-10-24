// src/app/shop/item/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import Client from "./view-client";

export default async function ShopItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) redirect("/shop");

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/shop" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">
          ← Back to Shop
        </Link>
      </div>
      <Client id={idNum} />
    </main>
  );
}

