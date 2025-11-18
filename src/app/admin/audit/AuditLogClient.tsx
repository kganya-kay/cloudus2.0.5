"use client";

import { useMemo } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";

export function AuditLogClient() {
  const query = api.audit.list.useInfiniteQuery(
    { limit: 25 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const logs = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return (
    <div className="space-y-4 rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Audit log
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Every order event, refund, payout, and status change.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:border-blue-400 dark:border-blue-500 dark:text-blue-200"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-slate-800">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {query.isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-4">
                  <div className="skeleton h-10 rounded-2xl" />
                </td>
              </tr>
            )}
            {!query.isLoading &&
              logs.map((log) => (
                <tr key={log.id} className="text-gray-700 dark:text-slate-200">
                  <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {log.order?.name ?? `Order ${log.orderId}`}
                    </p>
                    {log.order?.code && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">{log.order.code}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{log.action}</p>
                    {log.actorId && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">Actor: {log.actorId}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <pre className="max-h-32 overflow-auto rounded-xl bg-gray-50 p-2 text-[11px] text-gray-600 dark:bg-slate-800 dark:text-slate-200">
                      {JSON.stringify(log.payload ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {query.hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-full border border-blue-200 px-5 py-2 text-xs font-semibold text-blue-700 hover:border-blue-400 disabled:opacity-60 dark:border-blue-500 dark:text-blue-200"
          >
            {query.isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
