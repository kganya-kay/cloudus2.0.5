"use client";
import Button from "@mui/material/Button/Button";
import { api } from "~/trpc/react";

export default function AllProjects() {
  const [allProjects] = api.project.getAll.useSuspenseQuery();

  return (
    <div>
      {allProjects.length == 0
        ? "You Have No Projects Yet"
        : ""}
      <ul
        role="list"
        className="flex flex-col gap-2 divide-y divide-white px-4"
      >
        {allProjects.map((project) => (
          <li key={project.id} className="gap-x-6 py-5 bg-gray-100 p-3 rounded-md">
            <div className="flex justify-between ">
              <div className="flex min-w-0 gap-x-4">
                <img
                  alt=""
                  src={project.image}
                  className="size-12 flex-none rounded-full"
                />
                <div className="min-w-0 flex-auto">
                  <p className="text-sm/6 font-semibold text-gray-900">
                    {project.name}
                  </p>
                  <p className="text-sm/6 font-semibold rounded-se-xl bg-red-500 px-1">
                    R {project.price}
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                <time dateTime={project.updatedAt.toDateString()}>
                  {project.updatedAt.toLocaleString()}
                </time>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
               <img src={project.image} className="rounded-xl" alt="" />
              </div>
              <div>
               <img src={project.image} className="rounded-xl" alt="" />
              </div>
              <div>
               <img src={project.image} className="rounded-xl" alt="" />
              </div>
              
            </div>
            <div className=" w-full">
              <p className="mt-1 truncate text-xs/5 text-black text-center max-w-56 ">
                {project.description}
              </p>
            </div>
            <div className="justify-self-center py-3">
              <Button variant="contained" className=" w-full bg-slate-400" href="./">
                View Project
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
