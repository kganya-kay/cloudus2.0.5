"use client";

import { useParams } from "next/navigation";
import path from "path";
import { useState } from "react";

import { api } from "~/trpc/react";

export default function LatestProject() {
  const params = useParams();
  let projectId = 0;
  let selectedProjectUserId = "";

  if (params.projectId) {
    projectId = parseInt(params.projectId.toString());
  } else {
    projectId = 1;
  }

  const selectedProject = api.project.select.useQuery({ id: projectId });

  if (selectedProject.data?.createdById) {
    selectedProjectUserId = selectedProject.data?.createdById;
  }

  const selectedProjectUser = api.user.select.useQuery({
    id: selectedProjectUserId,
  });

  console.log(selectedProject);
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
      alert("Order Created Successfully");
    },
  });

  return (
    <div className="w-full gap-4 justify-self-center bg-gray-100 p-3">
      {selectedProject ? (
        <>
          <div className="flex justify-between border-b border-y-white py-2">
            <div>
              <img
                alt=""
                src={selectedProject.data?.image}
                className="size-12 flex-none rounded-full bg-slate-400"
              />
            </div>
            <div>
              <p className="truncate text-gray-900 text-sm">
                Project Name:
                <span className="text-red-300">
                  {selectedProject.data?.name}
                </span>
              </p>
              <p className="truncate text-gray-700 text-sm">
                Created By:
                <span className="text-red-300">
                  {selectedProjectUser.data?.name}
                </span>
              </p>
            </div>
          </div>
        </>
      ) : (
        <p>No Selected Project</p>
      )}

      <div className="flex justify-between pt-2">
        <div>
          <p className="text-blue-500 text-xs">{selectedProjectUser.data?.email}</p>
          <p className="text-xs pb-2">
            Project Type:{" "}
            <span className="text-red-300">{selectedProject.data?.type}</span>
          </p>
          
          <a href={selectedProject.data?.link} className="text-xs text-white">
            
            <span className="rounded-md bg-gray-400 px-3 py-1 ">
              {selectedProject.data?.link}
            </span>
          </a>
        </div>
        <div>
          <p className="text-xs">
            Created On:{" "}
            <span className="text-blue-400">
              {selectedProject.data?.createdAt.toDateString()}
            </span>
          </p>
          <p className="rounded-e-lg bg-red-400 px-3 text-white text-xs">
            Project Budget: <span>R {selectedProject.data?.price}</span>
          </p>
        </div>
      </div>

      <br />
      <div className="flex-col border-t border-y-gray-200">
        <p className="pt-2 text-sm text-blue-400">Project Media</p>
        <div className="bg-gray-50 rounded-lg">
          {selectedProject.data?.links ? (
            <p className="text-center text-xs  ">Project Has No Media</p>
          ) : (
            selectedProject.data?.links.map((link) => (
              <div key={link.toString()}>
                <img src={link} className="size-16" alt="" />
              </div>
            ))
          )}
        </div>
      </div>
      <br />
      <div>
        <p className="text-sm text-blue-400">Project Description</p>
        <div className="bg-gray-50 rounded-md">
          <p className="text-center text-xs ">
            {selectedProject.data?.description}
          </p>
        </div>
      </div>
      <br />

      <div>
        <p className="text-sm text-blue-400">Contributors To: {selectedProject.data?.name}</p>
        <div className="bg-gray-50">
          <p className="rounded-lg bg-red-400 text-center text-xs">
            {selectedProject.data?.api}
          </p>
        </div>
      </div>
      <br />
      <br />
      <div className="bg-blue-100 rounded-t-lg p-2">
        <p className="text-center">Want A Similar Project For Your Business?</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrder.mutate({ name, description, type });
        }}
        className="flex flex-col gap-2 bg-blue-100 px-2"
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
          placeholder="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />

        <label htmlFor="">
          Type
          <select
            name="OrderType"
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
            <option value="Custom">Custom</option>
          </select>
        </label>
        <h1>{type}</h1>
        <button
          type="submit"
          className="rounded-full bg-gray-400 px-10 py-3 font-semibold transition hover:bg-gray-700 hover:text-white"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Submitting Order..." : "Submit"}
        </button>
        <br />
      </form>
    </div>
  );
}
