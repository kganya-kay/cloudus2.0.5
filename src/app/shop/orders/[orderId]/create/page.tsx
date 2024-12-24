"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export default function LatestProject() {
  const [latestOrder] = api.order.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const createOrder = api.order.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
      setType("");
    },
  });

  return (
    <div className="w-full max-w-xs gap-4 justify-self-center">
      {latestOrder ? (
        <>
          <p className="truncate text-gray-700">
            Create Another Order Like:{" "}
            <span className="text-red-300">{latestOrder.name}</span>
          </p>
       
          <div className="flex justify-between border-y border-y-white py-1">
            <div>
            <img
            alt=""
            src={latestOrder.image}
            className="size-12 flex-none rounded-full bg-slate-400"
          />
            </div>
            <div><p className="text-sm">{latestOrder.description}</p></div>
          </div>
          
        </> 
      ) : (
        <p>You have no Orders yet.</p>
      )}
      <br />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrder.mutate({ name, description, type });
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
        <button
          type="submit"
          className="rounded-full bg-gray-400 px-10 py-3 font-semibold transition hover:bg-gray-700"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
