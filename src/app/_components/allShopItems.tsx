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
          <div className="bg-gray-100 p-3 rounded-md">
            <li  className="flex justify-between gap-x-6 py-5 ">
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
                  <p className="text-sm/6 font-semibold rounded-se-xl bg-red-500 px-1">
                    R {shopItem.price}
                  </p>
                  
                </div>
              </div>
              <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                <p className="text-sm/6 text-gray-900">{shopItem.type}</p>

                <p className="mt-1 text-xs/5 text-blue-500  ">
                  Cloudus Product
                </p>
              </div>
            </li>
            <div className="flex justify-between gap-2">
              
              <div><img className="size-12 md:size-40 rounded-lg" src={shopItem.links[0]} alt="" /></div>
              <div><img className="size-12 md:size-40 rounded-lg" src={shopItem.links[1]} alt="" /></div>
              <div><img className="size-12 md:size-40 rounded-lg" src={shopItem.links[2]} alt="" /></div>

            </div>
            <br />
            <div>
            <p className="mt-1 truncate text-xs/5 text-gray-500 text-center">
                    {shopItem.description}
                  </p>
            </div>
            
            <div className="justify-self-center py-3">
              <Button variant="contained" className=" w-full bg-slate-400" href={`shop/orders/${shopItem.id}`}>
                Order Now!
              </Button>
            </div>
          </div>
        </div>
      ))}
    </ul>
  );
}
