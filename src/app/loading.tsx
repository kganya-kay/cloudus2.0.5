// app/loading.tsx
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[1000] grid place-items-center bg-white/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div
          aria-hidden
          className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
        />
        <p className="text-sm text-gray-700">Cloudus…</p>
      </div>
    </div>
  );
}
