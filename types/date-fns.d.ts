declare module "date-fns" {
  interface FormatDistanceToNowOptions {
    addSuffix?: boolean;
    includeSeconds?: boolean;
    locale?: unknown;
  }

  export function formatDistanceToNow(
    date: Date | number,
    options?: FormatDistanceToNowOptions,
  ): string;
}
