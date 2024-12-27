"use client";
import { Button } from "@mui/material";
import { api } from "~/trpc/react";

export default function AllShopItems() {
  const [allShopItems] = api.shopItem.getAll.useSuspenseQuery();

  return (
    <ul
      role="list"
      className="flex flex-col gap-2 divide-y divide-gray-50 px-4"
    >
      {allShopItems.map((shopItem) => (
        <div key={shopItem.id} className="flex flex-col justify-between">
          <div className="rounded-md bg-gray-100 p-3">
            <li className="flex  py-5">
              <div className="flex w-full  justify-between ">
                <div>
                  <img
                    alt=""
                    src={shopItem.image}
                    className="size-12  rounded-full bg-slate-400"
                  />
                </div>

                <div className="  justify-between">
                  <p className="rounded-se-xl bg-red-500 px-1 text-sm/6 font-semibold">
                    R {shopItem.price}
                  </p>
                  <p className="text-sm/6 font-semibold text-gray-900">
                    {shopItem.name}
                  </p>
                </div>
              </div>
            </li>
            <div className="flex justify-between">
              <div>
                <img
                  className="size-40 rounded-lg p-1 md:size-60"
                  src={shopItem.links[0]}
                  alt=""
                />
              </div>
              <div>
                <img
                  className="size-40 rounded-lg p-1 md:size-60"
                  src={shopItem.links[1]}
                  alt=""
                />
              </div>
              <div>
                <img
                  className="size-40 rounded-lg p-1 md:size-60"
                  src={shopItem.links[2]}
                  alt=""
                />
              </div>
            </div>
            <br />
            <div className="flex justify-center">
              <p className="mt-1 max-w-56 truncate text-center text-xs/5 text-gray-500">
                {shopItem.description}
              </p>
            </div>

            <div className="justify-self-center py-3">
              <Button
                style={{
                  minWidth: "200px",
                  minHeight: "30px",
                  position: "inherit",
                }}
                variant="contained"
                className="w-full bg-slate-400"
                href={`shop/orders/${shopItem.id}`}
              >
                Order Now!
              </Button>
            </div>
          </div>
        </div>
      ))}
    </ul>
  );
}
