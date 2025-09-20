// src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import AdminBoard from "./_components/AdminBoard";


export default async function AdminHome() {
const session = await auth();
const role = session?.user.role;
if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
redirect("/");
}
return (
<main className="mx-auto max-w-7xl p-6">
<div className="mb-4 flex items-center justify-between">
<h1 className="text-2xl font-bold text-gray-900">Today</h1>
</div>
<AdminBoard />
</main>
);
}