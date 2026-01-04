"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { RoomAdminStatus } from "@prisma/client";

export function RoomsAdminClient() {
  const [statusFilter, setStatusFilter] = useState<RoomAdminStatus | undefined>(
    RoomAdminStatus.PENDING
  );

  const listQuery = api.room.adminList.useQuery(
    { status: statusFilter },
    { staleTime: 10_000 }
  );
  const approveMutation = api.room.setStatus.useMutation({
    onSuccess: () => {
      listQuery.refetch();
    },
  });

  const rooms = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Pending", value: RoomAdminStatus.PENDING },
          { label: "Approved", value: RoomAdminStatus.APPROVED },
          { label: "Rejected", value: RoomAdminStatus.REJECTED },
          { label: "All", value: undefined },
        ].map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 transition ${
                active
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-blue-700 ring-blue-200 hover:bg-blue-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-700">
          No listings for this filter.
        </div>
      )}

      {rooms.map((room) => (
        <div
          key={room.id}
          className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">{room.title}</p>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                {room.adminStatus}
              </span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">{room.description}</p>
            <p className="text-xs text-gray-500">
              Host: {room.host?.name ?? "Unknown"} ({room.host?.email ?? "no email"}) ·{" "}
              {room.address?.city ?? "No city"}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                {room.currency} {(room.nightlyRateCents / 100).toFixed(2)} / night
              </span>
              {room.monthlyRateCents ? (
                <span className="rounded-full bg-green-50 px-2 py-1 font-semibold text-green-700">
                  {room.currency} {(room.monthlyRateCents / 100).toFixed(0)} / month
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                approveMutation.mutate({
                  roomId: room.id,
                  status: RoomAdminStatus.APPROVED,
                })
              }
              disabled={approveMutation.isPending}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-not-allowed disabled:bg-green-200"
            >
              {approveMutation.isPending ? "Saving..." : "Approve"}
            </button>
            <button
              onClick={() =>
                approveMutation.mutate({
                  roomId: room.id,
                  status: RoomAdminStatus.REJECTED,
                })
              }
              disabled={approveMutation.isPending}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {approveMutation.isPending ? "Saving..." : "Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
