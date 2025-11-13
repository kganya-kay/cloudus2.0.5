"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { api, type RouterInputs } from "~/trpc/react";

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: Role;
  };
  isSelf: boolean;
};

const roleOptions: Role[] = [
  "ADMIN",
  "CARETAKER",
  "SUPPLIER",
  "CUSTOMER",
  "DRIVER",
];

export default function UserAdminControls({ user, isSelf }: Props) {
  const router = useRouter();
  const utils = api.useUtils();
  const [initialName, setInitialName] = useState(user.name ?? "");
  const [initialEmail, setInitialEmail] = useState(user.email ?? "");
  const [initialRole, setInitialRole] = useState<Role>(user.role);

  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState<Role>(user.role);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminUpdate = api.user.adminUpdate.useMutation({
    onSuccess: async (updated) => {
      setMessage("User updated.");
      setError(null);
      setInitialName(updated.name ?? "");
      setInitialEmail(updated.email ?? "");
      setInitialRole(updated.role);
      setName(updated.name ?? "");
      setEmail(updated.email ?? "");
      setRole(updated.role);
      await utils.user.getAll.invalidate().catch(() => undefined);
    },
    onError: (err) => {
      setError(err.message ?? "Failed to update user.");
      setMessage(null);
    },
  });

  const adminDelete = api.user.adminDelete.useMutation({
    onSuccess: async () => {
      setMessage("User deleted.");
      setError(null);
      await utils.user.getAll.invalidate().catch(() => undefined);
      router.push("/admin/users");
      router.refresh();
    },
    onError: (err) => {
      setError(err.message ?? "Failed to delete user.");
      setMessage(null);
    },
  });

  const onSave = () => {
    setMessage(null);
    setError(null);
    const payload: RouterInputs["user"]["adminUpdate"]["data"] = {};

    if (name !== initialName) {
      const trimmed = name.trim();
      payload.name = trimmed.length > 0 ? trimmed : null;
    }
    if (email !== initialEmail) {
      const trimmed = email.trim();
      payload.email = trimmed.length > 0 ? trimmed : null;
    }
    if (role !== initialRole) {
      payload.role = role;
    }

    if (Object.keys(payload).length === 0) {
      setMessage("No changes to save.");
      return;
    }

    adminUpdate.mutate({ id: user.id, data: payload });
  };

  const onDelete = () => {
    if (isSelf) return;
    const label = user.email ?? user.name ?? "this user";
    if (!confirm(`Delete ${label}? This action cannot be undone.`)) return;
    setMessage(null);
    setError(null);
    adminDelete.mutate({ id: user.id });
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Admin controls</h2>
        <p className="text-sm text-gray-600">
          Update roles, adjust profile details, or remove the user.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase text-gray-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
            placeholder="Email"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSave}
            disabled={adminUpdate.isPending}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {adminUpdate.isPending ? "Saving�?�" : "Save changes"}
          </button>
          <button
            onClick={onDelete}
            disabled={isSelf || adminDelete.isPending}
            className="rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
          >
            {adminDelete.isPending ? "Deleting�?�" : "Delete user"}
          </button>
          {isSelf && (
            <p className="text-xs text-gray-500">
              You cannot delete your own account.
            </p>
          )}
        </div>
        {message && <p className="text-xs text-green-700">{message}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
