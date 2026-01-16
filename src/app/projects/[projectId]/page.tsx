"use client";

import Button from "@mui/material/Button";
import { UploadButton } from "@uploadthing/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useCallback, useEffect } from "react";
import { OurFileRouter } from "~/app/api/uploadthing/core";
import { api } from "~/trpc/react";
import { IconButton } from "@mui/material";
import {
  PencilSquareIcon,
  CheckCircleIcon,
  BanknotesIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import type { ProjectTaskPayoutType } from "@prisma/client";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";


// Helper: safely extract a usable URL from UploadThing's callback result
function getUploadedUrl(files: unknown): string | undefined {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  const f = files[0] as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v : undefined);
  // Try common shapes:
  return (
    pick(f.url) ??
    pick(f.ufsUrl) ??
    pick((f.serverData as Record<string, unknown> | undefined)?.url) ??
    (pick(f.key) ? `https://utfs.io/f/${String(f.key)}` : undefined)
  );
}


/* ------------------------- Inline edit components ------------------------- */

function InlineEditText({
  value,
  onSave,
  placeholder,
  className,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  return editing ? (
    <div className={className}>
      <input
        className="w-full rounded-md border px-3 py-1 text-sm text-black focus:ring-2 focus:ring-blue-400"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
      />
      <div className="mt-2 flex gap-2">
        <Button
          onClick={() => {
            if (val !== value) onSave(val);
            setEditing(false);
          }}
          variant="contained"
          className="!rounded-full !bg-blue-600 !py-1 !text-white hover:!bg-blue-700"
        >
          Save
        </Button>
        <Button
          onClick={() => {
            setVal(value);
            setEditing(false);
          }}
          variant="outlined"
          className="!rounded-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className={className}>
      <p className="text-sm text-gray-800">{value ?? placeholder ?? "—"}</p>
      <IconButton
        aria-label="Edit"
        onClick={() => setEditing(true)}
        size="small"
        className="!ml-2 !p-1 hover:!bg-blue-50"
      >
        <PencilSquareIcon className="h-4 w-4 text-blue-600" />
      </IconButton>
    </div>
  );
}

function InlineEditNumber({
  value,
  onSave,
  className,
}: {
  value: number;
  onSave: (v: number) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<string>(String(value));

  return editing ? (
    <div className={className}>
      <input
        type="number"
        className="w-full rounded-md border px-3 py-1 text-sm text-black focus:ring-2 focus:ring-blue-400"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <Button
          onClick={() => {
            const num = Number(val);
            if (!Number.isNaN(num) && num !== value) onSave(num);
            setEditing(false);
          }}
          variant="contained"
          className="!rounded-full !bg-blue-600 !py-1 !text-white hover:!bg-blue-700"
        >
          Save
        </Button>
        <Button
          onClick={() => {
            setVal(String(value));
            setEditing(false);
          }}
          variant="outlined"
          className="!rounded-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className={className}>
      <p className="text-sm text-gray-800">{value}</p>
      <IconButton
        aria-label="Edit"
        onClick={() => setEditing(true)}
        size="small"
        className="!ml-2 !p-1 hover:!bg-blue-50"
      >
        <PencilSquareIcon className="h-4 w-4 text-blue-600" />
      </IconButton>
    </div>
  );
}

const formatCurrency = (value?: number) => {
  const amount = typeof value === "number" ? value / 100 : 0;
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `R ${amount.toFixed(0)}`;
  }
};

const shareLinkHref = (value: string) =>
  /^https?:\/\//i.test(value) || value.startsWith("/") ? value : undefined;

const shareLinkLabel = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).hostname.replace("www.", "");
    } catch {
      return value;
    }
  }
  return value.length > 32 ? `${value.slice(0, 32)}…` : value;
};

const OWNER_ROUTE_SHORTCUTS = [
  {
    title: "Supplier dashboard",
    description: "Approve catalog items, emit payouts, and sync fulfilment.",
    href: "/suppliers/dashboard",
  },
  {
    title: "Driver hub",
    description: "Assign pickups, capture GPS updates, and monitor delivery SLAs.",
    href: "/drivers/dashboard",
  },
  {
    title: "Laundry flow",
    description: "Route customer laundry requests straight into Cloudus ops.",
    href: "/laundry",
  },
  {
    title: "Calendar",
    description: "Book design reviews, dev standups, and go-live checkpoints.",
    href: "/calendar",
  },
  {
    title: "Shop",
    description: "Bundle digital services and trigger instant payments.",
    href: "/shop",
  },
];

function InlineEditToggle({
  value,
  onSave,
  trueLabel = "Yes",
  falseLabel = "No",
  className,
}: {
  value: boolean;
  onSave: (v: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<boolean>(value);

  return editing ? (
    <div className={className}>
      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={val}
            onChange={(e) => setVal(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          <span className="ml-2 text-sm text-gray-800">
            {val ? trueLabel : falseLabel}
          </span>
        </label>
      </div>
      <div className="mt-2 flex gap-2">
        <Button
          onClick={() => {
            if (val !== value) onSave(val);
            setEditing(false);
          }}
          variant="contained"
          className="!rounded-full !bg-blue-600 !py-1 !text-white hover:!bg-blue-700"
        >
          Save
        </Button>
        <Button
          onClick={() => {
            setVal(value);
            setEditing(false);
          }}
          variant="outlined"
          className="!rounded-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className={className}>
      <p className="text-sm text-gray-800">{value ? trueLabel : falseLabel}</p>
      <IconButton
        aria-label="Edit"
        onClick={() => setEditing(true)}
        size="small"
        className="!ml-2 !p-1 hover:!bg-blue-50"
      >
        <PencilSquareIcon className="h-4 w-4 text-blue-600" />
      </IconButton>
    </div>
  );
}

function InlineEditTextarea({
  value,
  onSave,
  className,
  rows = 3,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  return editing ? (
    <div className={className}>
      <textarea
        rows={rows}
        className="w-full rounded-md border px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <Button
          onClick={() => {
            if (val !== value) onSave(val);
            setEditing(false);
          }}
          variant="contained"
          className="!rounded-full !bg-blue-600 !py-1 !text-white hover:!bg-blue-700"
        >
          Save
        </Button>
        <Button
          onClick={() => {
            setVal(value);
            setEditing(false);
          }}
          variant="outlined"
          className="!rounded-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className={className}>
      <p className="text-xs text-gray-700">{value || "—"}</p>
      <IconButton
        aria-label="Edit"
        onClick={() => setEditing(true)}
        size="small"
        className="!ml-2 !p-1 hover:!bg-blue-50"
      >
        <PencilSquareIcon className="h-4 w-4 text-blue-600" />
      </IconButton>
    </div>
  );
}

/* ------------------------------- Page comp ------------------------------- */

export default function LatestProject() {
  const router = useRouter();
  const { projectId } = useParams<{ projectId?: string }>();
  const parsedId = projectId ? Number(projectId) : 1;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;

  const utils = api.useUtils();
  const tasksQuery = api.project.tasks.useQuery({ projectId: parsedId });
  const tasks = tasksQuery.data ?? [];

  const selectedProject = api.project.select.useQuery({ id: parsedId });
  const paymentPortal = api.project.paymentPortal.useQuery(
    { projectId: parsedId },
    { enabled: Boolean(selectedProject.data?.viewerContext?.isOwner) },
  );
  const [paymentCheckoutError, setPaymentCheckoutError] = useState<string | null>(null);
  const [paymentCheckoutLoading, setPaymentCheckoutLoading] = useState(false);

  // Update + Delete mutations
  const updateProject = api.project.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.project.select.invalidate({ id: parsedId }),
        utils.project.getAll.invalidate(),
        utils.project.getLatest.invalidate(),
      ]);
    },
    onError: () => {
      alert("❌ Error: You may not have permission to update this project.");
    },
  });

  const deleteProject = api.project.delete.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      alert("🗑️ Project deleted.");
      router.push("/projects");
    },
    onError: () => {
      alert("❌ Error: You may need to sign in or lack permission to delete this project.");
    },
  });

  const handleDelete = () => {
    const p = selectedProject.data;
    if (!p) return;
    const ok = confirm(`Delete "${p.name}"? This cannot be undone.`);
    if (!ok) return;
    deleteProject.mutate({ id: p.id });
  };

  const handleLaunchDepositCheckout = async () => {
    const pendingPaymentId = paymentPortal.data?.pendingPayment?.id;
    if (!pendingPaymentId) {
      setPaymentCheckoutError("No pending deposit to pay right now.");
      return;
    }
    try {
      setPaymentCheckoutError(null);
      setPaymentCheckoutLoading(true);
      const response = await fetch("/api/projects/payments/paystack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pendingPaymentId }),
      });
      const data = (await response.json().catch(() => null)) as
        | { checkoutUrl?: string; error?: string }
        | null;
      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error ?? "Unable to start checkout. Please try again.");
      }
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setPaymentCheckoutError(
        error instanceof Error ? error.message : "Unable to launch Paystack checkout.",
      );
      setPaymentCheckoutLoading(false);
    }
  };

  const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cents = Math.round(Number(newTaskBudget) * 100);
    if (!newTaskTitle.trim()) {
      alert("Task title is required.");
      return;
    }
    if (!Number.isFinite(cents) || cents <= 0) {
      alert("Budget must be greater than zero.");
      return;
    }
    createTaskMutation.mutate({
      projectId: parsedId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      budgetCents: cents,
    });
  };

  const handleDeleteTask = (taskId: number) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    deleteTaskMutation.mutate({ taskId });
  };

  const handleSplitBudget = () => {
    splitTaskBudgetMutation.mutate({ projectId: parsedId });
  };

  const handleClaimTask = (taskId: number) => {
    claimTaskMutation.mutate({ taskId });
  };

  const handleStartTask = (taskId: number) => {
    progressTaskMutation.mutate({ taskId, status: "IN_PROGRESS" });
  };

  const handleSubmitTask = (taskId: number) => {
    progressTaskMutation.mutate({ taskId, status: "SUBMITTED" });
  };

  const handleApproveTask = (taskId: number) => {
    reviewTaskMutation.mutate({ taskId, action: "APPROVE" });
  };

  const handleRejectTask = (taskId: number) => {
    reviewTaskMutation.mutate({ taskId, action: "REJECT" });
  };

  const handleRequestPayout = (taskId: number, type: ProjectTaskPayoutType) => {
    requestTaskPayoutMutation.mutate({ taskId, type });
  };

  const handleRequestCustomPayout = (taskId: number) => {
    const raw = window.prompt("Enter payout amount (R):");
    if (!raw) return;
    const cents = Math.round(Number(raw) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      alert("Invalid amount.");
      return;
    }
    requestTaskPayoutMutation.mutate({
      taskId,
      type: "CUSTOM",
      amountCents: cents,
    });
  };

  const handleRespondPayout = (requestId: number, action: "APPROVE" | "REJECT") => {
    respondTaskPayoutMutation.mutate({ requestId, action });
  };

  const handleOwnerPayout = (taskId: number) => {
    ownerPayoutTaskMutation.mutate({ taskId });
  };

  const handleBidSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedBidTaskIds.length === 0) {
      alert("Select at least one available task to bid on.");
      return;
    }
    const selectedTasks = tasks.filter((task) => selectedBidTaskIds.includes(task.id));
    const totalCents = selectedTasks.reduce(
      (sum, task) => sum + (task.budgetCents ?? 0),
      0,
    );
    if (!Number.isFinite(totalCents) || totalCents <= 0) {
      alert("Selected tasks must have a budget assigned by the owner.");
      return;
    }
    createBid.mutate({
      projectId: parsedId,
      taskIds: selectedBidTaskIds,
      message: bidMessage.trim() || undefined,
    });
  };

  // Create flow (unchanged)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState(0);
  const [contactNumber, setContactNumber] = useState("");
  const [link, setLink] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskBudget, setNewTaskBudget] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [selectedBidTaskIds, setSelectedBidTaskIds] = useState<number[]>([]);
  const [bidMessage, setBidMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"activity" | "details" | "chat">(
    "activity",
  );
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    hostId: "",
    startAt: "",
    endAt: "",
    location: "",
    venue: "",
    streamUrl: "",
  });
  const usersQuery = api.user.getAll.useQuery(undefined, { enabled: isAdmin });
  const createEvent = api.event.create.useMutation({
    onSuccess: async (event) => {
      await utils.event.list.invalidate();
      router.push(`/events/${event.id}`);
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("");
      setLink("");
      setPrice(0);
      setContactNumber("");
      alert("✅ Project Created Successfully!");
    },
    onError: async () => {
      alert("❌ Error: Please sign in to create a project");
    },
  });

  const createBid = api.project.bid.useMutation({
    onSuccess: async () => {
      await utils.project.select.invalidate({ id: parsedId });
      setSelectedBidTaskIds([]);
      setBidMessage("");
      alert("Bid submitted for review.");
    },
    onError: (error) => alert(error.message ?? "Unable to submit bid."),
  });

  const respondBid = api.project.respondBid.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.project.listBids.invalidate({ projectId: parsedId }),
        utils.project.select.invalidate({ id: parsedId }),
      ]);
    },
    onError: (error) => alert(error.message ?? "Unable to update bid."),
  });

  const p = selectedProject.data;
  if (!p) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-6">
          <p className="text-center text-sm text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }
  const canManageEvents = Boolean(p?.viewerContext?.isOwner) || isAdmin;
  const hostOptions = useMemo(() => {
    const users = usersQuery.data ?? [];
    return users.map((user) => ({
      id: user.id,
      label: user.name ?? user.email ?? user.id,
    }));
  }, [usersQuery.data]);

  useEffect(() => {
    if (!eventForm.hostId && p?.createdById) {
      setEventForm((prev) => ({ ...prev, hostId: p.createdById }));
    }
  }, [eventForm.hostId, p?.createdById]);
  const followerAvatars =
    (p?.followers ?? [])
      .map((follow) => follow.user)
      .filter(
        (user): user is { id: string; name: string | null; image: string | null } =>
          Boolean(user),
      )
      .slice(0, 5);
  const followerCount = p?._count?.followers ?? 0;
  const contributorCount = p?._count?.contributors ?? 0;
  const bidsCount = p?._count?.bids ?? 0;
  const shareableLinks = (p?.links ?? []).filter(Boolean).slice(0, 3);
  const openTaskCount = tasks.filter((task) => task.status === "BACKLOG").length;
  const assignedTaskCount = tasks.filter((task) => Boolean(task.assignedToId)).length;
  const projectBudgetCents = p?.price ?? 0;
  const projectCostCents = p?.cost ?? 0;
  const availableBudgetCents = Math.max(projectBudgetCents - projectCostCents, 0);
  const budgetUsedPercent =
    projectBudgetCents > 0
      ? Math.min(100, Math.max(0, Math.round((projectCostCents / projectBudgetCents) * 100)))
      : 0;
  const contributorStats = useMemo(() => {
    const totalBudgetCents = tasks.reduce((sum, task) => sum + (task.budgetCents ?? 0), 0);
    const completedBudgetCents = tasks
      .filter((task) => ["APPROVED", "COMPLETED"].includes(task.status))
      .reduce((sum, task) => sum + (task.budgetCents ?? 0), 0);
    const payoutRequests = tasks.flatMap((task) => task.payoutRequests ?? []);
    const paidOutCents = payoutRequests
      .filter((request) => request.status === "APPROVED")
      .reduce((sum, request) => sum + request.amountCents, 0);
    const pendingPayoutCents = payoutRequests
      .filter((request) => request.status === "PENDING")
      .reduce((sum, request) => sum + request.amountCents, 0);
    return { totalBudgetCents, completedBudgetCents, paidOutCents, pendingPayoutCents };
  }, [tasks]);
  const {
    totalBudgetCents: taskBudgetCents,
    completedBudgetCents,
    paidOutCents: taskPaidOutCents,
    pendingPayoutCents,
  } = contributorStats;

  const paymentSummary = paymentPortal.data;
  const totalBudgetCents =
    typeof (paymentSummary?.project?.price ?? p?.price) === "number"
      ? (paymentSummary?.project?.price ?? p?.price ?? 0)
      : 0;
  const paidCents =
    typeof paymentSummary?.paidCents === "number" ? paymentSummary.paidCents : 0;
  const outstandingCents = Math.max(totalBudgetCents - paidCents, 0);
  const pendingPayment = paymentSummary?.pendingPayment ?? null;
  const availableBidTasks = tasks.filter(
    (task) => !task.assignedToId && task.status === "BACKLOG",
  );
  const selectedBidTotalCents = tasks.reduce((sum, task) => {
    if (!selectedBidTaskIds.includes(task.id)) return sum;
    return sum + (task.budgetCents ?? 0);
  }, 0);
  const refreshTasks = useCallback(async () => {
    await utils.project.tasks.invalidate({ projectId: parsedId });
  }, [parsedId, utils]);
  const createTaskMutation = api.project.createTask.useMutation({
    onSuccess: async () => {
      await refreshTasks();
      setNewTaskTitle("");
      setNewTaskBudget("");
      setNewTaskDescription("");
    },
    onError: (error) => alert(error.message ?? "Unable to create task."),
  });
  const deleteTaskMutation = api.project.deleteTask.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to delete task."),
  });
  const splitTaskBudgetMutation = api.project.splitTaskBudget.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to split budget."),
  });
  const claimTaskMutation = api.project.claimTask.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to claim task."),
  });
  const progressTaskMutation = api.project.progressTask.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to update task."),
  });
  const reviewTaskMutation = api.project.reviewTask.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to review task."),
  });
  const requestTaskPayoutMutation = api.project.requestTaskPayout.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to request payout."),
  });
  const respondTaskPayoutMutation = api.project.respondTaskPayout.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to update payout."),
  });
  const ownerPayoutTaskMutation = api.project.ownerPayoutTask.useMutation({
    onSuccess: refreshTasks,
    onError: (error) => alert(error.message ?? "Unable to pay out this task."),
  });
  const viewer = p?.viewerContext;
  const canBid = !!viewer && !viewer.isOwner && !viewer.isContributor && !!viewer.userId;
  const viewerBid = viewer?.bid ?? null;
  const canManageBids = !!viewer?.canManageBids;
  let bidContent: React.ReactNode;
  if (!viewer?.userId) {
    bidContent = (
      <p className="mt-2 text-sm text-gray-600">
        <Link href="/api/auth/signin" className="text-blue-600 underline">
          Sign in
        </Link>{" "}
        to place a bid and collaborate.
      </p>
    );
  } else if (viewer?.isOwner) {
    bidContent = <p className="mt-2 text-sm text-gray-600">You're the project owner.</p>;
  } else if (viewer?.isContributor) {
    bidContent = <p className="mt-2 text-sm text-gray-600">You're already a contributor.</p>;
  } else {
    bidContent = (
      <form className="mt-3 space-y-3" onSubmit={handleBidSubmit}>
        <div>
          <label className="text-xs uppercase text-gray-500">
            Select the tasks you can deliver
          </label>
          {availableBidTasks.length ? (
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-2xl border bg-white p-3 text-left text-sm text-gray-700">
              {availableBidTasks.map((task) => {
                const checked = selectedBidTaskIds.includes(task.id);
                return (
                  <label key={task.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={checked}
                      onChange={() =>
                        setSelectedBidTaskIds((prev) =>
                          checked ? prev.filter((id) => id !== task.id) : [...prev, task.id],
                        )
                      }
                    />
                    <span>
                      <span className="font-semibold text-gray-900">{task.title}</span>
                      <span className="block text-xs text-gray-500">
                        {formatCurrency(task.budgetCents)} · {task.status.replaceAll("_", " ")}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 rounded-2xl border border-dashed border-gray-200 p-3 text-sm text-gray-500">
              Project owner hasn&apos;t published unassigned tasks yet. Check back later.
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Selected budget total:{" "}
            <span className="font-semibold text-gray-900">
              {formatCurrency(selectedBidTotalCents)}
            </span>
          </p>
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500">Why you're a good fit</label>
          <textarea
            value={bidMessage}
            onChange={(e) => setBidMessage(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
            rows={3}
            placeholder="Include relevant skills, timeline, or questions."
          />
        </div>
        <button
          type="submit"
          disabled={createBid.isPending || availableBidTasks.length === 0}
          className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {createBid.isPending ? "Submitting..." : "Submit bid"}
        </button>
      </form>
    );
  }

  const projectBids = api.project.listBids.useQuery(
    { projectId: parsedId },
    { enabled: canManageBids },
  );
  const feedQuery = api.feed.list.useQuery({ limit: 50 });
  const projectEventsQuery = api.event.list.useQuery({ projectId: parsedId, take: 50 });
  const projectFeedItems = useMemo(
    () =>
      (feedQuery.data?.items ?? []).filter((post) => {
        const postProjectId = post.projectId ?? post.project?.id;
        return postProjectId === parsedId;
      }),
    [feedQuery.data, parsedId],
  );
  const statusSteps = ["Briefed", "Planning", "In progress", "Review", "Complete"];
  const normalizedStatus = (p?.status ?? "").toLowerCase();
  const activeStepIndex = Math.max(
    0,
    statusSteps.findIndex((step) => normalizedStatus.includes(step.toLowerCase())),
  );
  const projectFeedList = (
    <div className="space-y-3">
      {projectFeedItems.length === 0 ? (
        <p className="text-sm text-slate-500">No posts yet.</p>
      ) : (
        projectFeedItems.map((post) => {
          const author = post.creator?.user?.name ?? "Contributor";
          const summary = post.title ?? post.caption ?? "Project update";
          return (
            <div key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{author}</span>
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{summary}</p>
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title ?? "Project post"}
                  className="mt-3 h-44 w-full rounded-xl object-cover"
                />
              )}
              {post.caption && post.caption !== summary && (
                <p className="mt-2 text-sm text-slate-600">{post.caption}</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <img
                alt="Project cover"
                src={p.image ?? ""}
                className="h-14 w-14 rounded-2xl bg-slate-100 object-cover"
              />
              <div>
                <InlineEditText
                  value={p.name}
                  onSave={(val) => updateProject.mutate({ id: p.id, data: { name: val } })}
                  className="text-xl font-semibold text-slate-900"
                />
                <p className="text-xs text-slate-500">
                  Owner:{" "}
                  <span className="font-semibold text-slate-700">
                    {p.createdBy?.name ?? "Owner"}
                  </span>
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Budget</p>
              <p className="text-lg font-semibold text-slate-900">
                {formatCurrency(projectBudgetCents)}
              </p>
            </div>
          </div>

          <div className="mt-6 hidden rounded-full border border-slate-200 bg-white p-2 shadow-sm md:block">
            <div className="grid grid-cols-5 gap-2 text-xs font-semibold uppercase text-slate-500">
              {statusSteps.map((step, index) => {
                const isActive = index <= activeStepIndex;
                return (
                  <div
                    key={step}
                    className={`rounded-full px-3 py-2 text-center ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-100"
                    }`}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4">
            <div className="flex flex-wrap gap-6 border-b border-slate-200 pb-3 pt-3 text-sm font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`pb-2 ${
                  activeTab === "activity"
                    ? "border-b-2 border-blue-600 text-blue-700"
                    : "text-slate-500"
                }`}
              >
                Activity
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`pb-2 ${
                  activeTab === "details"
                    ? "border-b-2 border-blue-600 text-blue-700"
                    : "text-slate-500"
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`pb-2 ${
                  activeTab === "chat" ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500"
                }`}
              >
                Chat
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              {activeTab === "activity" && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Activity</p>
                    <p className="text-sm text-slate-600">
                      Recent updates from the project feed.
                    </p>
                  </div>
                  <div className="mt-4">{projectFeedList}</div>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Create event</p>
                <p className="text-sm text-gray-600">
                  Link an activation to this project so tasks and payouts sync automatically.
                </p>
              </div>
              <Link
                href="/events"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View all events
              </Link>
            </div>

            {canManageEvents ? (
              <form
                className="mt-4 grid gap-3 md:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (createEvent.isPending || !eventForm.name.trim()) return;
                  const hostId = isAdmin
                    ? eventForm.hostId || p.createdById
                    : session?.user?.id;
                  if (!hostId) return;
                  createEvent.mutate({
                    name: eventForm.name.trim(),
                    description: eventForm.description.trim() || undefined,
                    projectId: p.id,
                    hostId,
                    startAt: new Date(eventForm.startAt),
                    endAt: eventForm.endAt ? new Date(eventForm.endAt) : undefined,
                    location: eventForm.location.trim() || undefined,
                    venue: eventForm.venue.trim() || undefined,
                    streamUrl: eventForm.streamUrl.trim() || undefined,
                  });
                }}
              >
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900"
                  placeholder="Event name"
                  value={eventForm.name}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900"
                  value={eventForm.startAt}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, startAt: event.target.value }))
                  }
                  required
                />
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900"
                  value={eventForm.endAt}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, endAt: event.target.value }))
                  }
                />
                {isAdmin && (
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900"
                    value={eventForm.hostId}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, hostId: event.target.value }))
                    }
                  >
                    <option value="">Host (defaults to project owner)</option>
                    {hostOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900"
                  placeholder="Location"
                  value={eventForm.location}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900"
                  placeholder="Venue"
                  value={eventForm.venue}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, venue: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 md:col-span-2"
                  placeholder="YouTube or livestream URL"
                  value={eventForm.streamUrl}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, streamUrl: event.target.value }))
                  }
                />
                <textarea
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 md:col-span-2"
                  placeholder="Event description"
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <button
                  type="submit"
                  disabled={createEvent.isPending}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2 disabled:opacity-60"
                >
                  {createEvent.isPending ? "Creating event..." : "Create event"}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Only the project owner or an admin can create an event for this project.
              </p>
            )}
          </div>
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Project events</p>
                      <Link
                        href="/events"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View all
                      </Link>
                    </div>
                    {projectEventsQuery.isLoading ? (
                      <p className="mt-3 text-sm text-slate-500">Loading events...</p>
                    ) : projectEventsQuery.data?.items?.length ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {projectEventsQuery.data.items.map((event) => (
                          <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm transition hover:border-blue-200"
                          >
                            <p className="font-semibold text-slate-900">{event.name}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(event.startAt).toLocaleDateString()}{" "}
                              {event.location ? `• ${event.location}` : ""}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {event.shopItemCount} shop items
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {event.chatCount} chat posts
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No events yet.</p>
                    )}
                  </div>
                </section>
              )}

              {activeTab === "chat" && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Chat</p>
                    <p className="text-sm text-slate-600">
                      Live chatter for everyone following this project.
                    </p>
                  </div>
                  <div className="mt-4">{projectFeedList}</div>
                </section>
              )}

              {activeTab === "details" ? (
                <div className="space-y-6">
          {/* Project Info with inline edits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Project Type</p>
              <InlineEditText
                value={p.type}
                onSave={(val) => updateProject.mutate({ id: p.id, data: { type: val } })}
              />
              {p.link ? (
                <Link
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-white bg-blue-500 px-3 py-1 rounded-full hover:bg-blue-600 transition"
                >
                  Visit Project
                </Link>
              ) : null}
              <div className="mt-3">
                <p className="text-xs text-gray-500">Project URL</p>
                <InlineEditText
                  value={p.link ?? ""}
                  onSave={(val) => updateProject.mutate({ id: p.id, data: { link: val } })}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Created On</p>
              <p className="text-sm font-medium text-blue-500">
                {new Date(p.createdAt).toDateString()}
              </p>

              <div className="mt-3">
                <p className="text-xs text-gray-500">Budget (Price)</p>
                <InlineEditNumber
                  value={p.price}
                  onSave={(val) => updateProject.mutate({ id: p.id, data: { price: val } })}
                />
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500">WhatsApp (Contact #)</p>
                <InlineEditNumber
                  value={p.contactNumber ?? 0}
                  onSave={(val) => updateProject.mutate({ id: p.id, data: { contactNumber: val } })}
                />
              </div>
            </div>
          </div>

        {/* Status Bar with inline edits */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="flex-1 bg-orange-300 text-center text-sm py-2 rounded-lg">
              Status:{" "}
              <InlineEditText
                value={p.status ?? ""}
                onSave={(val) => updateProject.mutate({ id: p.id, data: { status: val } })}
                className="inline-block"
              />
            </div>
            <div className="flex-1 bg-green-300 text-center text-sm py-2 rounded-lg">
              Open Source:{" "}
              <InlineEditToggle
                value={Boolean(p.openSource)}
                onSave={(val) => updateProject.mutate({ id: p.id, data: { openSource: val } })}
                trueLabel="Yes"
                falseLabel="No"
                className="inline-block"
              />
            </div>
            <div className="flex-1 bg-green-600 text-white text-center text-sm py-2 rounded-lg">
              <InlineEditToggle
                value={Boolean(p.completed)}
                onSave={(val) => updateProject.mutate({ id: p.id, data: { completed: val } })}
                trueLabel="Completed"
                falseLabel="Active"
                className="inline-block"
              />
            </div>
          </div>

          {/* --- Project Media (replace your existing block with this) --- */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-blue-500">Project Media</p>

            <div className="flex gap-2 overflow-x-auto rounded-lg bg-gray-50 p-2">
              {p?.links?.length ? (
                p.links.map((media, index) => (
                  <img
                    key={index}
                    src={media}
                    className="h-20 w-20 rounded-md border object-cover"
                    alt={`Project media ${index + 1}`}
                  />
                ))
              ) : (
                <p className="text-xs text-gray-500">No media uploaded</p>
              )}
            </div>

            {/* Upload actions */}
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Replace Cover Image */}
              <div className="rounded-lg border bg-white p-3">
                <p className="mb-2 text-xs font-medium text-gray-700">Replace cover image</p>
                <UploadButton<OurFileRouter, "imageUploader">
                  endpoint="imageUploader"
                  onClientUploadComplete={(files) => {
                    const url = getUploadedUrl(files);
                    if (!url || !p) {
                      alert("Upload completed, but no URL found.");
                      return;
                    }
                    // ⬇️ Set the main cover image
                    updateProject.mutate({ id: p.id, data: { image: url } });
                  }}
                  onUploadError={(error: Error) => alert(`❌ ERROR! ${error.message}`)}
                />
              </div>

              {/* Add Gallery Image */}
              <div className="rounded-lg border bg-white p-3">
                <p className="mb-2 text-xs font-medium text-gray-700">Add to gallery</p>
                <UploadButton<OurFileRouter, "imageUploader">
                  endpoint="imageUploader"
                  onClientUploadComplete={(files) => {
                    const url = getUploadedUrl(files);
                    if (!url || !p) {
                      alert("Upload completed, but no URL found.");
                      return;
                    }
                    // ⬇️ Append to links[] gallery (keeps existing images)
                    const newLinks = Array.isArray(p.links) ? [...p.links, url] : [url];
                    updateProject.mutate({ id: p.id, data: { links: newLinks } });
                  }}
                  onUploadError={(error: Error) => alert(`❌ ERROR! ${error.message}`)}
                />
              </div>
            </div>
          </div>

          {/* Description inline edit */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-blue-500 mb-2">Project Description</p>
            <InlineEditTextarea
              value={p.description}
              onSave={(val) => updateProject.mutate({ id: p.id, data: { description: val } })}
            />
          </div>

          {/* Contributors */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-blue-500 mb-2">Contributors</p>
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              {p.contributors.length === 0 ? (
                <p>No contributors yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {p.contributors.map((contributor) => (
                    <span
                      key={contributor.id}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm"
                    >
                      {contributor.name ?? contributor.email ?? contributor.id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown (read-only except if you track cost) */}
          <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Budget overview</p>
                <h3 className="text-lg font-semibold text-gray-900">Cost, available budget, and bids</h3>
              </div>
              {projectBudgetCents > 0 && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {budgetUsedPercent}% used
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Total budget</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(projectBudgetCents)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Committed (cost)</p>
                <p className="mt-1 text-xl font-semibold text-amber-700">
                  {formatCurrency(projectCostCents)}
                </p>
                {projectBudgetCents > 0 && (
                  <p className="text-xs text-gray-500">{budgetUsedPercent}% of budget</p>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Available</p>
                <p className="mt-1 text-xl font-semibold text-emerald-700">
                  {formatCurrency(availableBudgetCents)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-500">Bids</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{bidsCount}</p>
                <p className="text-xs text-gray-500">Total bids received</p>
              </div>
            </div>
            {projectBudgetCents > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>{formatCurrency(projectBudgetCents)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${budgetUsedPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project tasks &amp; budget</h3>
                <p className="text-sm text-gray-600">Break down deliverables, assign contributors, and track payouts.</p>
              </div>
              {canManageBids && tasks.length > 0 && (
                <button
                  type="button"
                  onClick={handleSplitBudget}
                  disabled={splitTaskBudgetMutation.isPending}
                  className="rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {splitTaskBudgetMutation.isPending ? "Splitting..." : "Split budget evenly"}
                </button>
              )}
            </div>

            {canManageBids && (
              <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={handleCreateTask}>
                <div className="md:col-span-1">
                  <label className="text-xs uppercase text-gray-500">Task title</label>
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Landing page UI"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs uppercase text-gray-500">Budget (R)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newTaskBudget}
                    onChange={(e) => setNewTaskBudget(e.target.value)}
                    placeholder="1500"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs uppercase text-gray-500">Notes</label>
                  <input
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Deliverables or timeline"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {createTaskMutation.isPending ? "Adding task..." : "Add task"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6">
              {tasksQuery.isLoading ? (
                <p className="text-sm text-gray-500">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks yet. Project owner can add deliverables above.</p>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const assignedName =
                      task.assignedTo?.name ??
                      task.assignedTo?.email ??
                      (task.assignedToId ? "Contributor" : "Unassigned");
                    const isAssignedToViewer =
                      viewer?.userId && task.assignedToId === viewer.userId;
                    const pendingPayout = task.payoutRequests.find(
                      (request) => request.status === "PENDING",
                    );
                    const approvedPayout = task.payoutRequests.find(
                      (request) => request.status === "APPROVED",
                    );
                    return (
                      <div key={task.id} className="rounded-2xl border bg-gray-50 p-4 shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-500">
                              Budget {formatCurrency(task.budgetCents)} • Assigned to {assignedName}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-gray-700">
                            {task.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        {task.description && (
                          <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                          {task.submissionNote && (
                            <span className="rounded-full bg-white px-2 py-0.5">
                              Submission note: {task.submissionNote}
                            </span>
                          )}
                          {pendingPayout && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-amber-700">
                              Payout pending ({formatCurrency(pendingPayout.amountCents)})
                            </span>
                          )}
                          {approvedPayout && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-emerald-700">
                              Paid out ({formatCurrency(approvedPayout.amountCents)})
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {!task.assignedToId && viewer?.isContributor && (
                            <button
                              type="button"
                              onClick={() => handleClaimTask(task.id)}
                              disabled={claimTaskMutation.isPending}
                              className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              Claim task
                            </button>
                          )}
                          {isAssignedToViewer && task.status === "IN_PROGRESS" && (
                            <button
                              type="button"
                              onClick={() => handleSubmitTask(task.id)}
                              disabled={progressTaskMutation.isPending}
                              className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Submit for approval
                            </button>
                          )}
                          {isAssignedToViewer && task.status === "BACKLOG" && (
                            <button
                              type="button"
                              onClick={() => handleStartTask(task.id)}
                              disabled={progressTaskMutation.isPending}
                              className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Start task
                            </button>
                          )}
                          {isAssignedToViewer && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRequestPayout(task.id, "HALF")}
                                disabled={requestTaskPayoutMutation.isPending}
                                className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                              >
                                Request 50% payout
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestPayout(task.id, "FULL")}
                                disabled={requestTaskPayoutMutation.isPending}
                                className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                              >
                                Request full payout
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestCustomPayout(task.id)}
                                disabled={requestTaskPayoutMutation.isPending}
                                className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                              >
                                Request custom payout
                              </button>
                            </>
                          )}
                          {canManageBids && task.status === "SUBMITTED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveTask(task.id)}
                                disabled={reviewTaskMutation.isPending}
                                className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Approve task
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectTask(task.id)}
                                disabled={reviewTaskMutation.isPending}
                                className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Needs changes
                              </button>
                            </>
                          )}
                          {canManageBids &&
                            task.assignedToId &&
                            ["APPROVED", "COMPLETED"].includes(task.status) &&
                            !pendingPayout &&
                            !approvedPayout && (
                              <button
                                type="button"
                                onClick={() => handleOwnerPayout(task.id)}
                                disabled={ownerPayoutTaskMutation.isPending}
                                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Pay contributor
                              </button>
                            )}
                          {canManageBids && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={deleteTaskMutation.isPending}
                              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {canManageBids && task.payoutRequests.length > 0 && (
                          <div className="mt-3 rounded-xl bg-white p-3 text-xs text-gray-700">
                            <p className="font-semibold text-gray-900">Payout requests</p>
                            <div className="mt-2 space-y-2">
                              {task.payoutRequests.map((request) => (
                                <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2 py-1">
                                  <div>
                                    <p className="font-semibold">
                                      {request.user?.name ?? request.user?.email ?? "Contributor"}
                                    </p>
                                    <p className="text-gray-500">
                                      {formatCurrency(request.amountCents)} • {request.type.toLowerCase()}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {request.status === "PENDING" ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleRespondPayout(request.id, "APPROVE")}
                                          disabled={respondTaskPayoutMutation.isPending}
                                          className="rounded-full bg-green-600 px-3 py-1 text-white disabled:opacity-50"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRespondPayout(request.id, "REJECT")}
                                          disabled={respondTaskPayoutMutation.isPending}
                                          className="rounded-full bg-red-600 px-3 py-1 text-white disabled:opacity-50"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    ) : (
                                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                        {request.status.toLowerCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div id="bid" className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Contribute to this project</h3>
              {bidContent}
              {viewerBid && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-800">Your latest bid</p>
                  <p>
                    Amount: <span className="font-semibold">{formatCurrency(viewerBid.amount)}</span>
                  </p>
                  <p>Status: {viewerBid.status.toLowerCase()}</p>
                  {viewerBid.message && <p className="mt-1 text-gray-500">“{viewerBid.message}”</p>}
                </div>
              )}
            </div>

            {canManageBids && (
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Bid requests</h3>
                {projectBids.isLoading ? (
                  <p className="text-sm text-gray-500">Loading bids...</p>
                ) : projectBids.data?.length ? (
                  <div className="mt-3 space-y-3">
                    {projectBids.data.map((bid) => (
                      <div key={bid.id} className="rounded-xl border bg-gray-50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {bid.user?.name ?? bid.user?.email ?? bid.userId}
                            </p>
                            <p className="text-xs text-gray-500">{bid.user?.email ?? "—"}</p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              bid.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : bid.status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {bid.status.toLowerCase()}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700">
                          Bid: <span className="font-semibold">{formatCurrency(bid.amount)}</span>
                        </p>
                        {bid.message && (
                          <p className="mt-1 text-xs text-gray-500">“{bid.message}”</p>
                        )}
                        {bid.status === "PENDING" && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => respondBid.mutate({ bidId: bid.id, action: "APPROVE" })}
                              disabled={respondBid.isPending}
                              className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => respondBid.mutate({ bidId: bid.id, action: "REJECT" })}
                              disabled={respondBid.isPending}
                              className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No bids yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
    <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Community & reach</p>
                <dl className="mt-4 grid gap-4 text-sm text-gray-600 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Followers</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{followerCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Contributors</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{contributorCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Open tasks</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{openTaskCount}</dd>
                  </div>
                </dl>
                {followerAvatars.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Latest followers</p>
                    <div className="mt-2 flex -space-x-3">
                      {followerAvatars.map((user) => (
                        <img
                          key={user.id}
                          src={
                            user.image ??
                            "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV"
                          }
                          alt={user.name ?? "Follower"}
                          className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {shareableLinks.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Shareable links</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {shareableLinks.map((link) => {
                        const href = shareLinkHref(link);
                        const label = shareLinkLabel(link);
                        const className =
                          "inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700";
                        return href ? (
                          <a
                            key={`${p?.id}-link-${label}`}
                            href={href}
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel={href.startsWith("http") ? "noreferrer" : undefined}
                            className={className}
                          >
                            {label}
                          </a>
                        ) : (
                          <span key={`${p?.id}-link-${label}`} className={className}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="mt-4 text-xs text-gray-500">
                  {bidsCount} bids submitted and {assignedTaskCount} tasks assigned
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-emerald-600">
                  Contributor earnings
                </p>
                <dl className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <dt>Total task budget</dt>
                    <dd className="text-base font-semibold text-gray-900">
                      {formatCurrency(taskBudgetCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Approved work</dt>
                    <dd className="text-base font-semibold text-gray-900">
                      {formatCurrency(completedBudgetCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Paid out</dt>
                    <dd className="text-base font-semibold text-emerald-700">
                      {formatCurrency(taskPaidOutCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Pending payouts</dt>
                    <dd className="text-base font-semibold text-amber-700">
                      {formatCurrency(pendingPayoutCents)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-gray-500">
                  Keep tasks updated so contributors can request payouts as they submit work.
                </p>
              </div>

              {viewer?.isOwner && (
                <div className="rounded-3xl border border-emerald-200 bg-white/80 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Funding summary</p>
                  {paymentPortal.isLoading ? (
                    <p className="mt-2 text-sm text-gray-500">Loading payment data...</p>
                  ) : (
                    <>
                      <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                        {formatCurrency(outstandingCents)} outstanding of{" "}
                        {formatCurrency(totalBudgetCents)}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Paid to date:{" "}
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(paidCents)}
                        </span>
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          onClick={handleLaunchDepositCheckout}
                          disabled={paymentCheckoutLoading || !pendingPayment}
                          variant="contained"
                          className="!rounded-full !bg-blue-600"
                        >
                          {paymentCheckoutLoading ? "Launching checkout..." : "Pay deposit now"}
                        </Button>
                        <Button
                          component={Link}
                          href={`/projects/${p.id}/payment${
                            pendingPayment ? `?paymentId=${pendingPayment.id}` : ""
                          }`}
                          variant="outlined"
                          className="!rounded-full"
                        >
                          Open payment portal
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Payment reference: {pendingPayment?.id ?? "No pending deposit"}
                      </p>
                      {paymentCheckoutError && (
                        <p className="mt-1 text-xs text-red-600">{paymentCheckoutError}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {viewer?.isOwner && (
                <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-sm text-gray-700">
                  <p className="text-xs font-semibold uppercase text-blue-600">Route shortcuts</p>
                  <ul className="mt-3 space-y-3">
                    {OWNER_ROUTE_SHORTCUTS.map((route) => (
                      <li key={route.href} className="rounded-2xl bg-white/70 p-3 shadow-sm">
                        <Link href={route.href} className="font-semibold text-blue-700">
                          {route.title}
                        </Link>
                        <p className="text-xs text-gray-600">{route.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

      {/* Create New Project (unchanged) */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <p className="text-center font-semibold text-gray-700">
          Want a Similar Project for Your Business?
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProject.mutate({
              name,
              description,
              type,
              link,
              price,
              contactNumber: Number(contactNumber),
            });
          }}
          className="flex flex-col gap-3 mt-4"
        >
          <input
            type="text"
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border px-4 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="tel"
            placeholder="Your WhatsApp Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full rounded-full border px-4 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400"
            required
          />

          <textarea
            placeholder="Project Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400"
            rows={3}
          />

          <select
            name="OrderType"
            id="pt"
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-full border px-4 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Type</option>
            <option value="Print">Print</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Audio">Audio</option>
            <option value="Visual">Visual</option>
            <option value="Academic">Academic</option>
            <option value="Custom">Custom</option>
          </select>

          <button
            type="submit"
            disabled={createProject.isPending}
            className="rounded-full bg-blue-500 text-white px-6 py-2 text-sm font-semibold hover:bg-blue-600 transition"
          >
            {createProject.isPending ? "Initializing Project..." : "Submit"}
          </button>

          <Button
            href="./"
            type="button"
            variant="outlined"
            className="rounded-full px-6 py-2 font-semibold transition hover:bg-gray-700 hover:text-white"
          >
            View Your Projects
          </Button>
        </form>
      </div>
      </div>
    </div>
  );
}
