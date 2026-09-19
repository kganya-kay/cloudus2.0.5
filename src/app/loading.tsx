export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[1000] grid place-items-center bg-os-bg/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          aria-hidden
          className="h-12 w-12 rounded-full border-4 border-os-accent border-t-transparent animate-spin"
        />
        <p className="text-sm text-os-muted">Cloudus OS</p>
      </div>
    </div>
  );
}
