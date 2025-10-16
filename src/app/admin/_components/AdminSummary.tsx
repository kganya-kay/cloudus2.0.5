"use client";

import { api } from "~/trpc/react";

export default function AdminSummary() {
  const { data } = api.order.dashboardSummary.useQuery();
  const s = data ?? {
    dailyOrders: 0,
    yesterdayOrders: 0,
    openOrders: 0,
    closedOrders: 0,
    totalUsers: 0,
  };

  const Card = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <Card label="Daily Orders" value={s.dailyOrders} />
      <Card label="Yesterday's Orders" value={s.yesterdayOrders} />
      <Card label="Open Orders" value={s.openOrders} />
      <Card label="Closed Orders" value={s.closedOrders} />
      <Card label="Total Users" value={s.totalUsers} />
    </div>
  );
}

