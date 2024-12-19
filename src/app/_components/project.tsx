"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestProject() {
  const [latestProject] = api.project.getLatest.useSuspenseQuery();


  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("");
    },
  });

  return (
    <div className="w-full max-w-xs gap-4 justify-self-center">
      {latestProject ? (
        <p className="truncate">Your most recent project: {latestProject.name}</p>
      ) : (
        <p>You have no projects yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProject.mutate({ name, description, type });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <input
          type="text"
          placeholder="Describe your Project"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />

        <label htmlFor="">
            Project Type
            <select name="projectType" id="pt" onChange={(e) => setType(e.target.value)} className="w-full rounded-full px-4 py-2 text-gray-500">
                <option value="Print">Print</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Audio">Audio</option>
                <option value="Visual">Visual</option>
                <option value="Academic">Academic</option>
                <option value="Craft">Craft</option>
            </select>
        </label>
        <h1>{type}</h1>
        <button
          type="submit"
          className="rounded-full bg-white/40 px-10 py-3 font-semibold transition hover:bg-white/80 "
          disabled={createProject.isPending}
        >
          {createProject.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>

      

    </div>
  );
}
