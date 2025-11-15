"use client";

import Link from "next/link";
import Button from "@mui/material/Button/Button";
import { api } from "~/trpc/react";

/** Neutral SVG placeholder (swap to a branded image if you prefer). */
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
      <defs>
        <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0%' stop-color='#eef2ff'/>
          <stop offset='100%' stop-color='#f8fafc'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <rect x='32' y='32' width='736' height='536' rx='20' ry='20' fill='#ffffff' stroke='#e5e7eb'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            font-family='Arial, Helvetica, sans-serif' font-size='20' fill='#94a3b8'>
        Cloudus · No image
      </text>
    </svg>`
  );

/** Safe helper for missing URLs. */
function imgOrPlaceholder(url: string | undefined): string {
  return url && url.trim().length > 0 ? url : PLACEHOLDER_IMG;
}

export default function AllProjects() {
  const [allProjects] = api.project.getOpenSource.useSuspenseQuery();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Empty state */}
      {allProjects.length === 0 ? (
        <div className="mx-auto my-10 max-w-md rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-800">No Projects (yet)</h2>
          <p className="mt-2 text-sm text-gray-600">
            We’ll showcase open-source and community projects here as they go live.
          </p>
        </div>
      ) : null}

      {/* Title */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Flagship & open-source projects</h1>
        <p className="text-sm text-gray-600">
          Explore customer launches, product experiments, and community initiatives. Fork an idea, request access,
          or start your own brief from <Link href="/projects/create" className="text-blue-700 underline">/projects/create</Link>.
        </p>
      </div>

      {/* Grid of project cards */}
      <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allProjects.map((project) => {
          const hero = imgOrPlaceholder(project.image);
          const thumbs: Array<string> = [
            imgOrPlaceholder(project.links?.[0]),
            imgOrPlaceholder(project.links?.[1]),
            imgOrPlaceholder(project.links?.[2]),
          ];

          return (
            <li
              key={project.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg"
            >
              {/* Media */}
              <div className="relative">
                <img
                  src={hero}
                  alt={project.name}
                  className="h-48 w-full object-cover transition will-change-transform group-hover:scale-[1.02]"
                />

                {/* Status & Type pills */}
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded-full bg-blue-600/90 px-2.5 py-1 text-xs font-semibold text-white shadow">
                    {project.status}
                  </span>
                </div>
                <div className="absolute right-3 top-3">
                  <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {project.type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3 p-4">
                <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
                  {project.name}
                </h3>

                <p className="line-clamp-3 text-sm text-gray-600">{project.description}</p>

                {/* Thumbnails */}
                <div className="mt-1 flex gap-2">
                  {thumbs.map((src, i) => (
                    <img
                      key={`${project.id}-thumb-${i}`}
                      src={src}
                      alt={`${project.name} preview ${i + 1}`}
                      className="h-14 w-14 rounded-md object-cover ring-1 ring-gray-200"
                    />
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-2 flex gap-2">
                  <Button
                    href={`projects/${project.id}`}
                    variant="contained"
                    className="!rounded-xl !bg-blue-600 !py-2 !text-white hover:!bg-blue-700"
                    style={{ minWidth: "140px", minHeight: "36px", position: "inherit" }}
                  >
                    View
                  </Button>
                  <Button
                    href={`projects/${project.id}#bid`}
                    variant="outlined"
                    className="!rounded-xl"
                    style={{ minWidth: "140px", minHeight: "36px", position: "inherit" }}
                  >
                    Bid or contribute
                  </Button>
                </div>
              </div>

              {/* Subtle hover ring */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-blue-400/40" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
