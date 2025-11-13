export const SUPER_ADMIN_EMAIL = "kganyakekana@gmail.com" as const;

export const isSuperAdminEmail = (email: string | null | undefined) =>
  !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL;
