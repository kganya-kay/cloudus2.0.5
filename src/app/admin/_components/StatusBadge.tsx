export function StatusBadge({ status }: { status: string }) {
const map: Record<string, string> = {
NEW: "bg-gray-100 text-gray-700",
SOURCING_SUPPLIER: "bg-yellow-100 text-yellow-800",
SUPPLIER_CONFIRMED: "bg-indigo-100 text-indigo-800",
IN_PROGRESS: "bg-blue-100 text-blue-800",
READY_FOR_DELIVERY: "bg-cyan-100 text-cyan-800",
OUT_FOR_DELIVERY: "bg-teal-100 text-teal-800",
DELIVERED: "bg-green-100 text-green-800",
CLOSED: "bg-zinc-200 text-zinc-700",
CANCELED: "bg-red-100 text-red-800",
};
const cls = map[status] ?? "bg-gray-100 text-gray-700";
return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}