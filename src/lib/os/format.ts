export const formatZarFromCents = (value?: number | null) => {
  const amount = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(Math.round(amount / 100));
  } catch {
    return `R ${Math.round(amount / 100)}`;
  }
};

export const formatShortDate = (value?: string | Date | null) => {
  if (!value) return "Date TBC";
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "short",
    }).format(new Date(value));
  } catch {
    return "Date TBC";
  }
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "Soon";
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Soon";
  }
};

export const parseCapture = (name: string) => {
  const match = /^\[(NOTE|IDEA|TASK)\]\s*(.*)$/.exec(name);
  if (!match) {
    return { kind: "NOTE" as const, text: name };
  }
  const kind = (match[1] ?? "NOTE") as "NOTE" | "IDEA" | "TASK";
  return { kind, text: match[2] ?? name };
};
