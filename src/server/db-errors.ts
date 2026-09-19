export function isDatabaseUnreachable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("P1001") ||
    message.includes("P1017")
  );
}
