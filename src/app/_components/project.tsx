"use client";

import Link from "next/link";
import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestProject() {
  const [latestProject] = api.project.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState(0);
  const [contactNumber, setContactNumber] = useState(0);
  const [link, setLink] = useState("");
  
  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("");
      setPrice(0);
      setLink("");
      setContactNumber(0);
      alert("Project Created Successfully. Go To Projects")
    },
  });

  return (
    <div className="w-full max-w-xs gap-4 justify-self-center">
      {latestProject ? (
        <>
          <h4 className="truncate text-gray-700">
            Create Another Project Like:{" "}
            <br />
            <span className="text-red-300">
              <Link href={`./${latestProject.id}`}>{latestProject.name}</Link>
            </span>
          </h4>

          <div className="flex justify-center border-t border-y-white py-1">
            <div>
              <img
                alt=""
                src={latestProject.image}
                className="size-12 flex-none rounded-full bg-slate-400"
              />
            </div>
          </div>
          <div>
            <p className="text-center text-sm">{latestProject.description}</p>
          </div>
        </>
      ) : (
        <h2>You have no projects yet.</h2>
      )}
      <br />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProject.mutate({ name, description, type, price, link, contactNumber });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
          required
        />
        <input
          type="text"
          placeholder="Describe your Project"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
          required
        />
        <br />
        <label htmlFor="">
          Project Type
          <select
            name="projectType"
            id="pt"
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-full px-4 py-2 text-gray-500"
          >
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
        <br />
        <p>Project Budget</p>
        <input
          type="number"
          placeholder="Project Estimated Budget"
          value={price}
          onChange={(e) => setPrice(parseInt(e.target.value))}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <input
          type="tel"
          placeholder="Whatsapp Number"
          value={contactNumber}
          onChange={(e) => setContactNumber(parseInt(e.target.value))}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <br />
        <p>
          Project Link <span className="text-xs text-blue-400">Optional</span>
        </p>
        <input
          type="text"
          placeholder="Paste Existing Link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <br />
        <p>
          <span className="text-xs text-blue-400">Optional File Links</span>
        </p>

        <div className="flex ">
          <div>
            <input type="file" placeholder="Project Image" />
            
          </div>
        </div>

        <button
          type="submit"
          className="rounded-full bg-gray-400 px-10 py-3 font-semibold transition hover:bg-gray-700"
          disabled={createProject.isPending}
        >
          {createProject.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
