// src/app/admin/_components/AdminBoard.tsx
"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { StatusBadge } from "./StatusBadge";


const COLS = [
    "NEW",
    "SOURCING_SUPPLIER",
    "SUPPLIER_CONFIRMED",
    "IN_PROGRESS",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
] as const;

export default function AdminBoard() {
    const { data, isLoading } = api.order.listToday.useQuery();
    const utils = api.useUtils();
    const changeStatus = api.order.changeStatus.useMutation({
        onSuccess: async () => {
            await utils.order.listToday.invalidate();
        },
    });


    const [dragId, setDragId] = useState<number | null>(null);


    if (isLoading) return <p className="text-sm text-gray-500">Loading board…</p>;


    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7">
            {COLS.map((col) => {
                const items = (data?.[col as keyof typeof data] as any[]) ?? [];
                return (
                    <div
                        key={col}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (dragId != null) {
                                changeStatus.mutate({ orderId: dragId, status: col as any });
                                setDragId(null);
                            }
                        }}
                        className="rounded-xl border bg-white p-3"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800">{col.replaceAll("_", " ")}</h3>
                            <span className="text-xs text-gray-500">{items.length}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {items.map((o) => (
                                <div
                                    key={o.id}
                                    draggable
                                    onDragStart={() => setDragId(o.id)}
                                    className="cursor-grab rounded-lg border px-3 py-2 hover:shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-800">{o.code}</span>
                                        <StatusBadge status={o.status} />
                                    </div>
                                    <p className="truncate text-xs text-gray-600">{o.customerName ?? "—"}</p>
                                    <p className="text-[11px] text-gray-400">{o.suburb ?? ""} {o.city ?? ""}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}