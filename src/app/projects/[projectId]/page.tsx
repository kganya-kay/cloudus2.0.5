"use client";

import Button from "@mui/material/Button";
import { UploadButton } from "@uploadthing/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { OurFileRouter } from "~/app/api/uploadthing/core";
import { api } from "~/trpc/react";
import { IconButton } from "@mui/material";
import { PencilSquareIcon } from "@heroicons/react/24/outline";


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
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  } catch {
    return `R ${value ?? 0}`;
  }
};

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

  const utils = api.useUtils();

  const selectedProject = api.project.select.useQuery({ id: parsedId });

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

  const handleBidSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Bid amount must be greater than zero.");
      return;
    }
    createBid.mutate({
      projectId: parsedId,
      amount: Math.round(amount),
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
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

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
      setBidAmount("");
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
  const viewer = p?.viewerContext;
  const canBid = !!viewer && !viewer.isOwner && !viewer.isContributor && !!viewer.userId;
  const viewerBid = viewer?.bid ?? null;
  const canManageBids = !!viewer?.canManageBids;

  const projectBids = api.project.listBids.useQuery(
    { projectId: parsedId },
    { enabled: canManageBids },
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-md rounded-xl">
      {/* Top actions */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          href="./"
          type="button"
          variant="outlined"
          className="rounded-full px-6 py-2 font-semibold transition hover:bg-gray-700 hover:text-white"
        >
          Exit Project Mode
        </Button>

        <Button
          type="button"
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={deleteProject.isPending || !p}
          className="rounded-full px-6 py-2 font-semibold"
        >
          {deleteProject.isPending ? "Deleting…" : "Delete Project"}
        </Button>
      </div>

      {p ? (
        <>
          {/* Project Header + inline name edit */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b pb-4">
            <img
              alt="Project"
              src={p.image ?? ""}
              className="w-16 h-16 rounded-full bg-slate-200 object-cover"
            />
            <div className="w-full text-center sm:text-left">
              <InlineEditText
                value={p.name}
                onSave={(val) => updateProject.mutate({ id: p.id, data: { name: val } })}
                className="max-w-lg"
              />
              <p className="text-xs text-gray-600">
                Created by{" "}
                <span className="font-medium text-blue-500">
                  {p.createdBy?.name ?? "—"}
                </span>
              </p>
              <p className="text-xs text-gray-500">{p.createdBy?.email ?? "—"}</p>
            </div>
          </div>

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
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <div className="flex-1 bg-orange-300 text-center text-sm py-2 rounded-lg">
              Cost: {p.cost ?? 0}
            </div>
            <div className="flex-1 bg-green-300 text-center text-sm py-2 rounded-lg">
              Available: {p.price - (p.cost ?? 0)}
            </div>
            <div className="flex-1 bg-red-300 text-center text-sm py-2 rounded-lg">Bids</div>
          </div>

          <div id="bid" className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Contribute to this project</h3>
              {!viewer?.userId ? (
                <p className="mt-2 text-sm text-gray-600">
                  <Link href="/api/auth/signin" className="text-blue-600 underline">
                    Sign in
                  </Link>{" "}
                  to place a bid and collaborate.
                </p>
              ) : viewer?.isOwner ? (
                <p className="mt-2 text-sm text-gray-600">You're the project owner.</p>
              ) : viewer?.isContributor ? (
                <p className="mt-2 text-sm text-gray-600">You're already a contributor.</p>
              ) : (
                <form className="mt-3 space-y-3" onSubmit={handleBidSubmit}>
                  <div>
                    <label className="text-xs uppercase text-gray-500">Your bid (budget portion)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                      placeholder="e.g. 5000"
                      required
                    />
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
                    disabled={createBid.isPending}
                    className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {createBid.isPending ? "Submitting..." : "Submit bid"}
                  </button>
                </form>
              )}
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
        </>
      ) : (
        <p className="text-center text-sm text-gray-500">Loading project...</p>
      )}

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
  );
}
