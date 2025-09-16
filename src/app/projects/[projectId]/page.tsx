"use client";

import Button from "@mui/material/Button";
import { UploadButton } from "@uploadthing/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { OurFileRouter } from "~/app/api/uploadthing/core";
import { api } from "~/trpc/react";

export default function LatestProject() {
  const router = useRouter();
  const { projectId } = useParams<{ projectId?: string }>();
  const parsedId = projectId ? Number(projectId) : 1;

  const selectedProject = api.project.select.useQuery({ id: parsedId });
  const selectedProjectUser = api.user.select.useQuery({
    id: selectedProject.data?.createdById ?? "",
  });

  const utils = api.useUtils();

  // --- NEW: delete mutation
  const deleteProject = api.project.delete.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      alert("🗑️ Project deleted.");
      router.push("/projects"); // or "./" if you prefer
    },
    onError: () => {
      alert("❌ Error: You may need to sign in or lack permission to delete this project.");
    },
  });

  const handleDelete = () => {
    const projName = selectedProject.data?.name ?? "this project";
    const projId = selectedProject.data?.id;
    if (!projId) return;

    const ok = confirm(`Are you sure you want to delete "${projName}"? This cannot be undone.`);
    if (!ok) return;

    deleteProject.mutate({ id: projId });
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState(0);
  const [contactNumber, setContactNumber] = useState("");
  const [link, setLink] = useState("");

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
          disabled={deleteProject.isPending || !selectedProject.data}
          className="rounded-full px-6 py-2 font-semibold"
        >
          {deleteProject.isPending ? "Deleting…" : "Delete Project"}
        </Button>
      </div>

      {selectedProject.data ? (
        <>
          {/* Project Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b pb-4">
            <img
              alt="Project"
              src={selectedProject.data.image ?? ""}
              className="w-16 h-16 rounded-full bg-slate-200 object-cover"
            />
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-900 font-semibold">
                {selectedProject.data.name}
              </p>
              <p className="text-xs text-gray-600">
                Created by{" "}
                <span className="font-medium text-blue-500">
                  {selectedProjectUser.data?.name}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {selectedProjectUser.data?.email}
              </p>
            </div>
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Project Type</p>
              <p className="text-sm font-medium text-red-400">
                {selectedProject.data.type}
              </p>
              {selectedProject.data?.link && (
                <Link
                  href={selectedProject.data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-white bg-blue-500 px-3 py-1 rounded-full hover:bg-blue-600 transition"
                >
                  Visit Project
                </Link>
              )}
            </div>
            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Created On</p>
              <p className="text-sm font-medium text-blue-500">
                {new Date(selectedProject.data.createdAt).toDateString()}
              </p>
              <p className="text-xs mt-1 text-gray-500">
                Budget:{" "}
                <span className="text-red-400 font-semibold">
                  R {selectedProject.data.price}
                </span>
              </p>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="flex-1 bg-orange-300 text-center text-sm py-2 rounded-lg">
              Status: {selectedProject.data?.status}
            </div>
            <div className="flex-1 bg-green-300 text-center text-sm py-2 rounded-lg">
              {selectedProject.data?.openSource ? "Open Source: Yes" : "Open Source: No"}
            </div>
            <div className="flex-1 bg-green-600 text-white text-center text-sm py-2 rounded-lg">
              {selectedProject.data?.completed ? "Completed" : "Active"}
            </div>
          </div>

          {/* Media */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-blue-500 mb-2">Project Media</p>
            <div className="flex gap-2 overflow-x-auto rounded-lg bg-gray-50 p-2">
              {selectedProject.data.links?.length ? (
                selectedProject.data.links.map((media, index) => (
                  <img
                    key={index}
                    src={media}
                    className="w-20 h-20 object-cover rounded-md border"
                    alt="Project media"
                  />
                ))
              ) : (
                <p className="text-xs text-gray-500">No media uploaded</p>
              )}
            </div>
            <div className="mt-2">
              <UploadButton<OurFileRouter, "imageUploader">
                endpoint="imageUploader"
                onClientUploadComplete={() => alert("✅ Upload Completed")}
                onUploadError={(error: Error) =>
                  alert(`❌ ERROR! ${error.message}`)
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-blue-500 mb-2">
              Project Description
            </p>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-700">
                {selectedProject.data.description}
              </p>
            </div>
          </div>

          {/* Contributors */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-blue-500 mb-2">
              Contributors
            </p>
            <div className="bg-gray-50 p-2 rounded-lg">
              <p className="text-xs text-center text-red-500">
                {selectedProject.data.api ?? "No contributors yet"}
              </p>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <div className="flex-1 bg-orange-300 text-center text-sm py-2 rounded-lg">
              Cost: {selectedProject.data?.cost ?? 0}
            </div>
            <div className="flex-1 bg-green-300 text-center text-sm py-2 rounded-lg">
              Available:{" "}
              {selectedProject.data.price - (selectedProject.data.cost ?? 0)}
            </div>
            <div className="flex-1 bg-red-300 text-center text-sm py-2 rounded-lg">
              Bids
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-gray-500">Loading project...</p>
      )}

      {/* Create New Project */}
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
