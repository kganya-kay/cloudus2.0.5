"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/16/solid";

export default function LatestProject() {
  const [open, setOpen] = useState(false);
  const params = useParams();
  let itemId = 0;
  let price = 0;

  if (params.orderId) {
    itemId = parseInt(params.orderId.toString());
  } else {
    itemId = 5;
  }

  const selectedItem = api.shopItem.select.useQuery({ id: itemId });
  console.log(selectedItem);
  const utils = api.useUtils();

  if (selectedItem.data?.price) {
    price = selectedItem.data?.price;
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
      setOpen(true);
    },
  });

  return (
    <div className="w-full max-w-xl justify-center gap-4 justify-self-center p-2">
      {selectedItem ? (
        <>
          <div className="rounded-t-lg bg-gray-500">
            <h1 className="truncate text-center font-extrabold text-blue-500">
              Confirm Order:
            </h1>
            <p className="text-center font-semibold text-white">
              {selectedItem.data?.name}
            </p>
          </div>

          <div className="flex-col justify-between justify-items-center border-y border-y-white py-1">
            <div className="flex justify-center">
              <img
                alt=""
                src={selectedItem.data?.image}
                className="size-12 justify-self-center rounded-full bg-slate-400"
              />
            </div>
            <div>
              <p className="text-center text-sm">
                {selectedItem.data?.description}
              </p>
            </div>
          </div>
          <br />
          <p className="bg-green-500 p-2 font-semibold">
            Total: R {selectedItem.data?.price}
          </p>
        </>
      ) : (
        <p>You have no Orders yet.</p>
      )}
      <br />
      <div id="order" className="">
        <Dialog open={open} onClose={setOpen} className="relative z-10">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-400/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
          />

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <DialogPanel
                transition
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
              >
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:size-10">
                      <CheckIcon
                        aria-hidden="true"
                        className="size-6 text-green-600"
                      />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <DialogTitle
                        as="h3"
                        className="text-base font-semibold text-gray-900"
                      >
                        Order Created Successfully!!!
                      </DialogTitle>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          You will Receive a payment Link on the following
                          information:
                        </p>
                        <p className="text-sm text-gray-500">
                          Contact Number: 0{contactNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <Link
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                    href={"../"}
                  >
                    Home
                  </Link>
                  <button
                    type="button"
                    data-autofocus
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </div>
      <br />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrder.mutate({
            name,
            description,
            type,
            contactNumber,
            itemId,
            price,
          });
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
