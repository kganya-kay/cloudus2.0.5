// src/app/admin/reports/report-client.tsx
"use client";
import { api } from "~/trpc/react";


export default function Client() {
    const { data, isLoading } = api.order.reportDaily.useQuery();
    if (isLoading || !data) return <p className="text-sm text-gray-500">Loading…</p>;
    const toR = (c: number) => `R ${Math.round(c / 100)}`;
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-white p-4">
                <div className="text-xs text-gray-500">Revenue</div>
                <div className="text-xl font-bold">{toR(data.revenue)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
                <div className="text-xs text-gray-500">Supplier Payouts</div>
                <div className="text-xl font-bold">{toR(data.supplierPayouts)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
                <div className="text-xs text-gray-500">Refunds</div>
                <div className="text-xl font-bold">{toR(data.refunds)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
                <div className="text-xs text-gray-500">Margin</div>
                <div className="text-xl font-bold">{toR(data.margin)}</div>
            </div>
        </div>
    );
}