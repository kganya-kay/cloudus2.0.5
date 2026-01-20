export const SUPER_ADMIN_EMAILS = [
  "kganyakekana@gmail.com",
  "info@cloudusdigital.com",
] as const;

export const isSuperAdminEmail = (email: string | null | undefined) =>
  !!email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as (typeof SUPER_ADMIN_EMAILS)[number]);
