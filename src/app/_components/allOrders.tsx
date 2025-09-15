"use client";
import Button from "@mui/material/Button/Button";
import { api } from "~/trpc/react";

export default function AllProjects() {
  const [allOrders] = api.order.getAll.useSuspenseQuery();

  return (
    <div>
      {allOrders.length == 0 ? "You Have No Orders Yet" : ""}
      <ul
        role="list"
        className="flex flex-col gap-2 divide-y divide-white px-4"
      >
        {allOrders.map((order) => (
          <li
            key={order.id}
            className="gap-x-6 rounded-md bg-gray-100 p-3 py-5 "
          > 
            <div className="bg-slate-400 mb-3 rounded-sm">
              <p className=" text-center text-sm text-white font-bold">{order.name}</p>
              <p className=" text-center text-xs text-white">{order.description}</p>
                <p className=" text-center text-xs text-white font-bold">Price: ${order.price}</p>
                <p className=" text-center text-xs text-white font-bold">for product ID: {order.createdForId}</p>
            </div>
            <div className="flex justify-between">
              <div className="min-w-0">
                {order.image ? <img
                  alt=""
                  src={order.links[0]}
                  className="size-40 flex-none rounded-full"
                />: " "}
                
              </div>
            
            </div>
            
            
            <div className="justify-self-center p2-3">
              <Button
                style={{
                  minWidth: "200px",
                  minHeight: "30px",
                  position: "inherit",
                }}
                variant="contained"
                className="w-full bg-slate-400"
                href={`order/${order.id}`}
              >
                View Order
              </Button>
            </div>

                    
          </li>
        ))}
      </ul>
    </div>
  );
}
