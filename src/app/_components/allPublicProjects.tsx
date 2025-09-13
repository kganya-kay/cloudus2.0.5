"use client";
import Button from "@mui/material/Button/Button";
import { api } from "~/trpc/react";

export default function AllProjects() {
  const [allProjects] = api.project.getOpenSource.useSuspenseQuery();

  return (
    <div>
      {allProjects.length == 0 ? <p className="text-center">No Projects</p> : ""}

      <div className="flex justify-center">
                      <h1
          className="
            inline-block               /* shrink‐wrap to the border */
            mx-auto                    /* center the element horizontally */
            text-3xl
            font-bold
            tracking-tight
            text-gray-700
            text-center                /* center text inside */
            border-2                   /* 2px border */
            border-red-500             /* red color */
            p-4                        /* padding so the border isn’t flush */
            animate-pulse              /* Tailwind’s built‑in pulse animation */
            rounded-lg                /* rounded corners */
            w-full
            sm:w-1/2                  /* 50% width on small screens */  
          "
        >
          Our Projects
        </h1> 
      </div>
      <br />
      <ul
        role="list"
        className="flex flex-col gap-2 divide-y divide-white px-4"
      >
        {allProjects.map((project) => (
          <li
            key={project.id}
            className="gap-x-6 rounded-md bg-gray-100 p-3 py-5 "
          > 
            <div className="bg-slate-400 mb-3 rounded-sm">
              <p className=" text-center text-sm text-white font-bold">{project.name}</p>
            </div>
            <div className="flex justify-between">
              <div className="min-w-0">
                <img
                  alt=""
                  src={project.image}
                  className="size-12 flex-none rounded-full"
                />
              </div>
              <div className="min-w-0">
                <p className="rounded-se-xl bg-red-500 px-1 text-sm/6 font-semibold">
                  Project Status: {project.status}
                </p>

                <p className="rounded-xs bg-green-500 px-1 text-xs font-semibold my-2">
                  Project Type: {project.type}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <p className="mt-1 max-w-56 truncate text-center text-xs/5 text-black">
                {project.description}
              </p>
            </div>
            <div className="flex justify-between">
              <div>
                <img
                  src={project.links[0]}
                  className="size-40 rounded-xl p-1 object-cover"
                  alt=""
                />
              </div>
              <div>
                <img
                  src={project.links[1]}
                  className="size-40 rounded-xl p-1 object-cover"
                  alt=""
                />
              </div>
              <div>
                <img
                  src={project.links[2]}
                  className="size-40 rounded-xl p-1 object-cover"
                  alt=""
                />
              </div>
            </div>
         
            <div className="justify-self-center py-2">
              <Button
                style={{
                  minWidth: "200px",
                  minHeight: "30px",
                  position: "inherit",
                }}
                variant="contained"
                className="w-full bg-slate-400"
                href={`projects/${project.id}`}
              >
                View Project
              </Button>
            </div>

                    
          </li>
        ))}
      </ul>
    </div>
  );
}
