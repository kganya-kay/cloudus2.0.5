"use client";
import Link from "next/link";
import { waCustomerLink, waSupplierLink, mailCustomerLink } from "~/lib/contactLinks";


export function SpeedButtons(props: {
code: string;
customerPhone?: string | null;
customerEmail?: string | null;
supplierPhone?: string | null;
}) {
const { code, customerPhone, customerEmail, supplierPhone } = props;
return (
<div className="flex flex-wrap gap-2">
{customerPhone ? (
<Link
className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
href={waCustomerLink(customerPhone, code)}
target="_blank"
>
WhatsApp Customer
</Link>
) : null}
{customerEmail ? (
<Link
className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
href={mailCustomerLink(customerEmail, code)}
>
Email Customer
</Link>
) : null}
{supplierPhone ? (
<Link
className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
href={waSupplierLink(supplierPhone, code)}
target="_blank"
>
WhatsApp Supplier
</Link>
) : null}
</div>
);
}