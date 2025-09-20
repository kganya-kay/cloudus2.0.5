import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./report-client";


export default async function ReportsPage() {
const session = await auth();
const role = session?.user.role;
if (!role || (role !== "ADMIN" && role !== "CARETAKER")) redirect("/");
return (
<main className="mx-auto max-w-5xl p-6">
<h1 className="mb-4 text-2xl font-bold text-gray-900">Daily Cash-up</h1>
<Client />
</main>
);
}