"use client";
import { Button } from "@mui/material";
import { api } from "~/trpc/react";

export default function AllShopItems() {
  const [allShopItems] = api.shopItem.getAll.useSuspenseQuery();

  return (
    <ul
      role="list"
      className="flex flex-col gap-2 divide-y divide-gray-100 px-4"
    >
      {allShopItems.map((shopItem) => (
        <div className="flex flex-col justify-between">
          <div>
            <li key={shopItem.id} className="flex justify-between gap-x-6 py-5">
              <div className="flex min-w-0 gap-x-4">
                <img
                  alt=""
                  src={shopItem.image}
                  className="size-12 flex-none rounded-full bg-slate-400"
                />
                <div className="min-w-0 flex-auto">
                  <p className="text-sm/6 font-semibold text-gray-900">
                    {shopItem.name}
                  </p>
                  <p className="mt-1 truncate text-xs/5 text-gray-500">
                    {shopItem.description}
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                <p className="text-sm/6 text-gray-900">{shopItem.type}</p>

                <p className="mt-1 text-xs/5 text-green-500">
                  R {shopItem.price}
                </p>
              </div>
            </li>
            <div className="flex justify-between gap-12">
              <div>
                <img src={shopItem.links[0]} alt="" className="size-40" />
              </div>
              <div>
                <img src={shopItem.links[1]} alt="" className="size-40" />
              </div>
              <div>
                <img src={shopItem.links[2]} alt="" className="size-40" />
              </div>
            </div>
            <br />
            <div className="justify-self-center">
              <Button variant="outlined" className="py-3">
                Order Now!
              </Button>
            </div>
          </div>
        </div>
      ))}
    </ul>
  );
}
