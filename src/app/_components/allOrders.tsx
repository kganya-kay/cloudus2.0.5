"use client";
import Button from "@mui/material/Button/Button";
import { api } from "~/trpc/react";

export default function AllOrders() {
  // Assuming you have an order router with getAll
  const [allOrders] = api.order.getAll.useSuspenseQuery();

  return (
    <div>
      {allOrders.length === 0 ? "You Have No Orders Yet" : ""}

      <ul
        role="list"
        className="flex flex-col gap-2 divide-y divide-white px-4"
      >
        {allOrders.map((order: any) => {
          const orderId = order?.id ?? "";
          const orderNumber =
            order?.number ??
            order?.orderNumber ??
            (orderId ? `#${String(orderId).slice(0, 8)}` : "Order");

          const status =
            order?.status ??
            order?.state ??
            order?.paymentStatus ??
            "Pending";

          const totalAmount =
            typeof order?.total === "number"
              ? order.total
              : typeof order?.amount === "number"
              ? order.amount
              : undefined;

          const currency = order?.currency ?? "ZAR";

          const customerName =
            order?.customerName ??
            order?.customer?.name ??
            order?.buyer?.name ??
            "Customer";

          const customerEmail =
            order?.customerEmail ??
            order?.customer?.email ??
            order?.buyer?.email ??
            "";

          const createdAt =
            order?.createdAt ??
            order?.created_at ??
            order?.date ??
            order?.placedAt;

          const previewImage =
            order?.previewImage ??
            order?.image ??
            order?.items?.[0]?.image ??
            order?.items?.[0]?.product?.image ??
            "";

          return (
            <li
              key={orderId || orderNumber}
              className="gap-x-6 rounded-md bg-gray-100 p-3 py-5 "
            >
              <div className="mb-3 rounded-sm bg-slate-400">
                <p className="text-center text-sm font-bold text-white">
                  {orderNumber}
                </p>
              </div>

              <div className="flex justify-between">
                <div className="min-w-0">
                  {previewImage ? (
                    <img
                      alt=""
                      src={previewImage}
                      className="size-12 flex-none rounded-full object-cover"
                    />
                  ) : (
                    " "
                  )}
                </div>

                <div className="min-w-0 space-y-1 text-right">
                  <p className="rounded-se-xl bg-red-500 px-1 text-xs/6 font-semibold text-white">
                    Status: {status}
                  </p>

                  <p className="text-sm/6 font-semibold text-gray-900">
                    Total:{" "}
                    {typeof totalAmount === "number"
                      ? `${currency} ${totalAmount.toFixed(2)}`
                      : "—"}
                  </p>

                  <p className="text-sm/6 font-semibold text-gray-900">
                    Customer: {customerName}
                  </p>

                  {customerEmail ? (
                    <p className="text-xs/6 text-gray-600">
                      Email: {customerEmail}
                    </p>
                  ) : null}

                  <p className="text-xs/6 text-gray-600">
                    Created:{" "}
                    {createdAt
                      ? new Date(createdAt).toDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="justify-self-center p2-3 mt-3">
                <Button
                  style={{
                    minWidth: "200px",
                    minHeight: "30px",
                    position: "inherit",
                  }}
                  variant="contained"
                  className="w-full bg-slate-400"
                  href={`order/${orderId || ""}`}
                >
                  View Order
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
