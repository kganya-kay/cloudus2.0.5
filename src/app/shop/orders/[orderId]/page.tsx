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
import Image from "next/image";

export default function LatestProject() {
  const [open, setOpen] = useState(false);
  const params = useParams();
  let itemId = params.orderId ? Number(params.orderId) : 5;

  const selectedItem = api.shopItem.select.useQuery({ id: itemId });
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("1");
  const [contactNumber, setContactNumber] = useState("");

  const createOrder = api.order.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("1");
      setContactNumber("");
      setOpen(true);
    },
  });

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-md rounded-xl">
      {/* Selected Item Preview */}
      {selectedItem.data ? (
        <>
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">
              Confirm Order
            </h1>
            <p className="text-gray-500">{selectedItem.data.name}</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <img
              alt={selectedItem.data.name}
              src={selectedItem.data.image}
              className="w-16 h-16 rounded-full bg-gray-200 object-cover"
            />
            <p className="text-sm text-gray-600 text-center">
              {selectedItem.data.description}
            </p>
            <div className="relative w-full h-52 rounded-lg overflow-hidden">
              <Image
                src={selectedItem.data.image}
                alt="Cloudus Order Item"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-green-100 text-green-700 text-center py-2 font-semibold">
            Total: R {selectedItem.data.price}
          </p>
        </>
      ) : (
        <p className="text-center text-gray-500">You have no Orders yet.</p>
      )}

      {/* Order Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrder.mutate({
            name,
            description,
            type,
            contactNumber: Number(contactNumber),
            itemId,
            price: selectedItem.data?.price ?? 0,
          });
        }}
        className="mt-6 flex flex-col gap-4"
      >
        <input
          type="text"
          placeholder="Customer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          required
        />

        <textarea
          placeholder="Additional info"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          rows={3}
        />

        <div>
          <label className="text-xs text-gray-600">Contact Number</label>
          <input
            type="tel"
            placeholder="WhatsApp Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Quantity</label>
          <select
            name="OrderType"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mt-1 rounded-full border px-4 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-400"
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="1000">1000</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-full bg-blue-500 text-white px-8 py-2 text-sm font-semibold hover:bg-blue-600 transition"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Submitting Order..." : "Submit"}
        </button>
      </form>

      {/* Back Home */}
      <div className="mt-4 flex justify-center">
        <Link
          href="../"
          className="rounded-full bg-gray-400 text-white px-8 py-2 text-sm font-semibold hover:bg-gray-500 transition"
        >
          Home
        </Link>
      </div>

      {/* Success Dialog */}
      <Dialog open={open} onClose={setOpen} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle
                as="h3"
                className="mt-4 text-lg font-semibold text-gray-900"
              >
                Order Created Successfully!
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600">
                You will receive a payment link on:
              </p>
              <p className="text-sm font-medium text-gray-800">
                Contact: {contactNumber}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="../"
                  className="rounded-full bg-green-500 text-white px-6 py-2 text-sm font-semibold hover:bg-green-600 transition"
                >
                  Home
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
