'use client';
import { api } from "~/trpc/react";

export default function AllProjects() {
    const [allProjects] = api.project.getAll.useSuspenseQuery();
    
  return (
    <ul role="list" className="divide-y divide-gray-100 flex flex-col gap-2 px-4">
      {allProjects.map((project) => (
        <li key={project.id} className="flex justify-between gap-x-6 py-5">
          
          <div className="flex min-w-0 gap-x-4">
            <img
              alt=""
              src={project.image}
              className="size-12 flex-none rounded-full bg-slate-400"
            />
            <div className="min-w-0 flex-auto">
              <p className="text-sm/6 font-semibold text-gray-900">
                {project.name}
              </p>
              <p className="mt-1 truncate text-xs/5 text-gray-500">
                {project.description}
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
            <p className="text-sm/6 text-gray-900">{project.type}</p>
            {project.updatedAt ? (
              <p className="mt-1 text-xs/5 text-gray-500">
                Last Updated At{" "}
                <time dateTime={project.updatedAt.toDateString()}>
                  {project.updatedAt.toDateString()}
                </time>
              </p>
            ) : (
              <div className="mt-1 flex items-center gap-x-1.5">
                <div className="flex-none rounded-full bg-emerald-500/20 p-1">
                  <div className="size-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xs/5 text-gray-500">Online</p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
