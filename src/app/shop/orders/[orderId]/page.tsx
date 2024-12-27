"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

export default function LatestProject() {

  const params = useParams();
  let itemId = 0;
  let price = 0;

  if (params.orderId) {
      itemId = parseInt(params.orderId.toString())
      
  } else {
     itemId = 5
  }
  
  
  const selectedItem = api.shopItem.select.useQuery({id : itemId });
  console.log(selectedItem);
  const utils = api.useUtils();

  if (selectedItem.data?.price) {
    price = selectedItem.data?.price
  } 
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [contactNumber, setContactNumber] = useState(0);
  const createOrder = api.order.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("");
      setContactNumber(0);
      alert("Order Created Successfully")
    },
  });

  return (
    <div className="w-full max-w-xl gap-4 justify-self-center justify-center p-2">
      {selectedItem ? (
        <>
        <div className="bg-gray-500 rounded-t-lg">
        <h1 className=" text-center truncate text-blue-500 font-extrabold">
            Confirm Order:     
          </h1>
          <p className="text-white text-center font-semibold">{selectedItem.data?.name}</p>
        </div>
          
       
          <div className="flex-col justify-between justify-items-center border-y border-y-white py-1">
            <div className="justify-items-center">
            <img
            alt=""
            src={selectedItem.data?.image}
            className="size-12 flex-none rounded-full bg-slate-400 justify-self-center"
          />
            </div>
            <div><p className="text-sm text-center">{selectedItem.data?.description}</p></div>
          </div>
          <br />
          <p className="font-semibold bg-green-500 p-2">Total: R {selectedItem.data?.price}</p>
          
        </> 
      ) : (
        <p>You have no Orders yet.</p>
      )}
      <br />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrder.mutate({ name, description, type, contactNumber, itemId, price });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Customer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
          required
        />
        <input
          type="text"
          placeholder="Additional info"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <p>Contact Number</p>
        <input
          type="tel"
          value={contactNumber}
          onChange={(e) => setContactNumber(parseInt(e.target.value))}
          className="w-full rounded-full px-4 py-2 text-black"
          required
        />

        <label htmlFor="">
          Quantity
          <select
            name="OrderType"
            id="pt"
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-full px-4 py-2 text-gray-500"
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="1000">1000</option>
            <option value="custom">Custom</option>
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
