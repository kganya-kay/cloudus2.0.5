"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

export default function LatestProject() {

  const params = useParams();
  let itemId = 0;

  if (params.orderId) {
      itemId = parseInt(params.orderId.toString())
  } else {
     itemId = 5
  }
  
  
  const selectedItem = api.shopItem.select.useQuery({id : itemId });
  console.log(selectedItem);
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const createOrder = api.order.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("");
      alert("Order Created Successfully")
    },
  });

  return (
    <div className="w-full max-w-xs gap-4 justify-self-center">
      {selectedItem ? (
        <>
          <p className="truncate text-gray-700">
            Thank You for Ordering:{" "}
            <span className="text-red-300">{selectedItem.data?.name}</span>
          </p>
       
          <div className="flex justify-between border-y border-y-white py-1">
            <div>
            <img
            alt=""
            src={selectedItem.data?.image}
            className="size-12 flex-none rounded-full bg-slate-400"
          />
            </div>
            <div><p className="text-sm">{selectedItem.data?.description}</p></div>
          </div>
          
        </> 
      ) : (
        <p>You have no Orders yet.</p>
      )}
      <br />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrder.mutate({ name, description, type });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Order Reference"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <input
          type="text"
          placeholder="Additional info"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />

        <label htmlFor="">
          Quantity
          <select
            name="OrderType"
            id="pt"
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-full px-4 py-2 text-gray-500"
          >
            <option value="Print">1</option>
            <option value="Development">5</option>
            <option value="Design">10</option>
            <option value="Audio">50</option>
            <option value="Visual">100</option>
            <option value="Academic">1000</option>
            <option value="Pastry">Custom</option>
          </select>
        </label>
        <h1>{type}</h1>
        <button
          type="submit"
          className="rounded-full bg-gray-400 px-10 py-3 font-semibold transition hover:bg-gray-700"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Submitting Order..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
