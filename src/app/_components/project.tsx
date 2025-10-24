"use client";

import Link from "next/link";
import { useState } from "react";
import { UploadButton } from "~/utils/uploadthing";
import { api } from "~/trpc/react";

export function LatestProject() {
  const [latestProject] = api.project.getLatest.useSuspenseQuery();
  const utils = api.useUtils();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState(0);
  const [contactNumber, setContactNumber] = useState("");
  const [link, setLink] = useState("");
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [gallery, setGallery] = useState<string[]>([]);

  // Helper: extract URL from UploadThing result
  function getUploadedUrl(files: unknown): string | undefined {
    if (!Array.isArray(files) || files.length === 0) return undefined;
    const f = files[0] as Record<string, unknown>;
    const pick = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v : undefined);
    return (
      pick(f.url) ??
      pick(f.ufsUrl) ??
      pick((f.serverData as Record<string, unknown> | undefined)?.url) ??
      (pick(f.key) ? `https://utfs.io/f/${String(f.key)}` : undefined)
    );
  }

  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("");
      setPrice(0);
      setLink("");
      setContactNumber("");
      alert("✅ Project Created Successfully. Go To Projects");
    },
  });

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-md rounded-xl">
      {/* Latest project preview */}
      {latestProject ? (
        <div className="mb-6 border-b pb-4">
          <h4 className="text-gray-700 text-center sm:text-left font-semibold mb-3">
            Create Another Project Like:
          </h4>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              alt="Latest Project"
              src={latestProject.image ?? ""}
              className="w-16 h-16 rounded-full bg-slate-200 object-cover"
            />
            <div className="text-center sm:text-left">
              <Link
                href={`./${latestProject.id}`}
                className="text-red-400 font-semibold hover:underline"
              >
                {latestProject.name}
              </Link>
              <p className="text-xs text-gray-600 mt-1">
                {latestProject.description}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <h2 className="text-center text-gray-500 mb-6">
          You have no projects yet.
        </h2>
      )}

      {/* Create new project form */}
      <div>
        <h3 className="text-center sm:text-left text-lg font-semibold text-gray-700 mb-4">
          Start a New Project
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProject.mutate({
              name,
              description,
              type,
              price,
              link,
              contactNumber: Number(contactNumber),
              image: coverImage,
              links: gallery,
            });
          }}
          className="flex flex-col gap-4"
        >
          {/* Image uploaders */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Cover image</p>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const url = getUploadedUrl(res);
                  if (url) setCoverImage(url);
                }}
                onUploadError={(error: Error) => alert(`ERROR: ${error.message}`)}
              />
              {coverImage && (
                <img src={coverImage} alt="Cover" className="mt-2 h-24 w-24 rounded object-cover" />
              )}
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Gallery images</p>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const url = getUploadedUrl(res);
                  if (url) setGallery((g) => [...g, url]);
                }}
                onUploadError={(error: Error) => alert(`ERROR: ${error.message}`)}
              />
              {gallery.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {gallery.map((g) => (
                    <img key={g} src={g} alt="Gallery" className="h-16 w-16 rounded object-cover" />
                  ))}
                </div>
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            required
          />

          <textarea
            placeholder="Describe your project"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            rows={3}
            required
          />

          <div>
            <label className="text-xs text-gray-600">Project Type</label>
            <select
              name="projectType"
              id="pt"
              onChange={(e) => setType(e.target.value)}
              className="w-full mt-1 rounded-full border px-4 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Type</option>
              <option value="Print">Print</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Audio">Audio</option>
              <option value="Visual">Visual</option>
              <option value="Academic">Academic</option>
              <option value="Craft">Craft</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Project Budget</label>
            <input
              type="number"
              placeholder="Estimated Budget"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value))}
              className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Contact Number</label>
            <input
              type="tel"
              placeholder="WhatsApp Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">
              Project Link{" "}
              <span className="text-blue-400 font-light">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Paste existing link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Removed old plain file input; handled by UploadButton above */}

          <button
            type="submit"
            className="rounded-full bg-blue-500 text-white px-8 py-2 text-sm font-semibold hover:bg-blue-600 transition"
            disabled={createProject.isPending}
          >
            {createProject.isPending ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
