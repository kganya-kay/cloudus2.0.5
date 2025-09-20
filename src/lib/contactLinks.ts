export function normalizeZaPhone(input: string): string {
const digits = (input || "").replace(/\D+/g, "");
if (digits.startsWith("27")) return digits; // already intl
if (digits.startsWith("0")) return `27${digits.slice(1)}`;
// assume local 9 digits like 82... → prefix 27
return digits.length === 9 ? `27${digits}` : digits;
}


export function waCustomerLink(phone: string, code: string, extra?: string) {
const ms = extra ?? `Hi, I’m checking in about order ${code}.`;
return `https://wa.me/${normalizeZaPhone(phone)}?text=${encodeURIComponent(ms)}`;
}


export function waSupplierLink(phone: string, code: string, details?: string) {
const ms = details ?? `Order ${code}: Please confirm pickup/delivery readiness.`;
return `https://wa.me/${normalizeZaPhone(phone)}?text=${encodeURIComponent(ms)}`;
}


export function mailCustomerLink(email: string, code: string) {
return `mailto:${email}?subject=${encodeURIComponent(`Order ${code}`)}`;
}