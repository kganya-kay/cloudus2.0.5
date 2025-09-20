// src/app/admin/orders/[id]/view-client.tsx
"use client";
import { api } from "~/trpc/react";
import { SpeedButtons } from "../../_components/SpeedButtons";
import { StatusBadge } from "../../_components/StatusBadge";

export default function Client({ id }: { id: number }) {
    const { data: order, isLoading } = api.order.getById.useQuery({ orderId: id });
    const utils = api.useUtils();
    const changeStatus = api.order.changeStatus.useMutation({
        onSuccess: async () => {
            await utils.order.getById.invalidate({ orderId: id });
        },
    });
    if (isLoading || !order) return <p className="text-sm text-gray-500">Loading…</p>;


    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Order {order.code}</h1>
                    <p className="text-sm text-gray-500">{order.customerName ?? "—"}</p>
                </div>
                <StatusBadge status={order.status} />
            </div>


            <SpeedButtons
                code={order.code}
                customerPhone={order.customerName}
                customerEmail={order.customerEmail}
                supplierPhone={order.supplier?.phone}
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <section className="rounded-lg border p-3">
                    <h2 className="mb-2 text-sm font-semibold">Details</h2>
                    <ul className="space-y-1 text-sm text-gray-700">
                        <li>Price: R {Math.round((order.price ?? 0) / 100)}</li>
                        <li>Delivery: R {Math.round((order.deliveryCents ?? 0) / 100)}</li>
                        <li>Address: {order.addressLine1 ?? ""}, {order.suburb ?? ""}, {order.city ?? ""}</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {[
                            "SOURCING_SUPPLIER",
                            "SUPPLIER_CONFIRMED",
                            "IN_PROGRESS",
                            "READY_FOR_DELIVERY",
                            "OUT_FOR_DELIVERY",
                            "DELIVERED",
                            "CLOSED",
                        ].map((s) => (
                            <button
                                key={s}
                                onClick={() => changeStatus.mutate({ orderId: order.id, status: s as any })}
                                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                            >
                                {s.replaceAll("_", " ")}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border p-3">
                    <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
                    <ol className="space-y-2 text-sm">
                        {order.auditLogs.map((l) => (
                            <li key={l.id} className="rounded bg-gray-50 p-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">{l.action}</span>
                                    <span className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()}</span>
                                </div>
                                <pre className="mt-1 overflow-auto text-xs text-gray-600">{JSON.stringify(l.payload, null, 2)}</pre>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
            {order.payouts.length > 0 && (
                <section className="mt-4 rounded-lg border p-3">
                    <h2 className="mb-2 text-sm font-semibold">Payouts</h2>
                    <ul className="text-sm">
                        {order.payouts.map((p) => (
                            <li key={p.id} className="flex items-center justify-between border-b py-1 last:border-b-0">
                                <span>{p.status}</span>
                                <span>R {Math.round(p.amountCents / 100)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}