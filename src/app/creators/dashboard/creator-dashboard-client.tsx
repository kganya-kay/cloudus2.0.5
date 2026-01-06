"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownTrayIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { MarketplaceTasksPanel } from "~/app/_components/MarketplaceTasksPanel";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

type CreatorMe = RouterOutputs["creator"]["me"];
type FeedItem = RouterOutputs["feed"]["list"]["items"][number];
type ContributorOverview = RouterOutputs["project"]["contributorOverview"];
type StudioMode = "print" | "audio" | "video";

type StudioMaterial = {
  id: string;
  name: string;
  description: string;
  primaryImage: string;
  overlay: string;
  swatch: string;
  finish: "matte" | "gloss" | "satin";
  tone: "light" | "dark";
};

const studioModes: Record<StudioMode, { label: string; tagline: string; helper: string }> = {
  print: {
    label: "Print",
    tagline: "Textile + merch drops",
    helper: "Oversized tees, totes, posters, vinyl sleeves.",
  },
  audio: {
    label: "Audio",
    tagline: "Covers + waveforms",
    helper: "Playlist art, vinyl mockups, player UI overlays.",
  },
  video: {
    label: "Video",
    tagline: "Frames + titles",
    helper: "Storyboards, thumbnails, opening frames.",
  },
};

const studioMaterials: Record<StudioMode, StudioMaterial[]> = {
  print: [
    {
      id: "oversized-tee",
      name: "Oversized tee",
      description: "Organic cotton, 240gsm. Front print zone, edge-to-edge color.",
      primaryImage:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?auto=format&fit=crop&w=1000&q=80",
      swatch: "#0f172a",
      finish: "matte",
      tone: "dark",
    },
    {
      id: "tote",
      name: "Artist tote",
      description: "12oz canvas, black ink on natural base. Great for line art.",
      primaryImage:
        "https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=1100&q=80",
      overlay:
        "https://images.unsplash.com/photo-1509099836639-18ba02e2e2f0?auto=format&fit=crop&w=1000&q=80",
      swatch: "#e4d2b4",
      finish: "matte",
      tone: "light",
    },
    {
      id: "poster",
      name: "Studio poster",
      description: "A2 satin poster with room for bold gradients and typography.",
      primaryImage:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=900&q=80",
      swatch: "#0a0a0a",
      finish: "satin",
      tone: "dark",
    },
  ],
  audio: [
    {
      id: "vinyl",
      name: "Vinyl sleeve",
      description: '12" matte sleeve with centered art and back metadata block.',
      primaryImage:
        "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80",
      swatch: "#111827",
      finish: "matte",
      tone: "dark",
    },
    {
      id: "player",
      name: "Player UI",
      description: "Waveform player mock with hero art and mood lighting.",
      primaryImage:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      swatch: "#0f172a",
      finish: "gloss",
      tone: "dark",
    },
  ],
  video: [
    {
      id: "thumbnail",
      name: "Thumbnail",
      description: "16:9 hero frame with bold title overlay and texture.",
      primaryImage:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
      overlay:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
      swatch: "#0b1224",
      finish: "gloss",
      tone: "dark",
    },
    {
      id: "storyboard",
      name: "Storyboard frame",
      description: "Tall mobile frame for reels, with safety guides.",
      primaryImage:
        "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1100&q=80",
      overlay:
        "https://images.unsplash.com/photo-1529618160092-2f8ccc8e087b?auto=format&fit=crop&w=900&q=80",
      swatch: "#111827",
      finish: "satin",
      tone: "light",
    },
  ],
};

const formatCurrency = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return "R 0";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `R ${(value / 100).toFixed(0)}`;
  }
};

const defaultMode: StudioMode = "print";
const defaultMaterial =
  studioMaterials[defaultMode]?.[0] ??
  studioMaterials.print?.[0] ??
  studioMaterials.audio?.[0] ??
  studioMaterials.video?.[0];

export default function CreatorDashboardClient({
  initialProfile,
  recentFeed,
  workSummary,
}: {
  initialProfile: CreatorMe;
  recentFeed: FeedItem[];
  workSummary?: ContributorOverview | null;
}) {
  const utils = api.useUtils();
  const profile = initialProfile.profile;
  const earnings = initialProfile.earnings;

  const baseMaterial = defaultMaterial ?? studioMaterials[defaultMode]?.[0];
  if (!baseMaterial) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-800">
        Studio materials are not configured.
      </div>
    );
  }

  const [mode, setMode] = useState<StudioMode>(defaultMode);
  const [materialId, setMaterialId] = useState(baseMaterial.id);
  const [primaryImage, setPrimaryImage] = useState(baseMaterial.primaryImage);
  const [overlayImage, setOverlayImage] = useState(baseMaterial.overlay);
  const [primaryInput, setPrimaryInput] = useState(baseMaterial.primaryImage);
  const [overlayInput, setOverlayInput] = useState(baseMaterial.overlay);
  const [finish, setFinish] = useState<StudioMaterial["finish"]>(baseMaterial.finish);
  const [backgroundTone, setBackgroundTone] = useState<StudioMaterial["tone"]>(baseMaterial.tone);

  const [artworkScale, setArtworkScale] = useState(82);
  const [artworkOpacity, setArtworkOpacity] = useState(94);
  const [artworkOffsetX, setArtworkOffsetX] = useState(0);
  const [artworkOffsetY, setArtworkOffsetY] = useState(0);
  const [artworkRotation, setArtworkRotation] = useState(0);

  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [tagline, setTagline] = useState(profile?.tagline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [skills, setSkills] = useState((profile?.skills ?? []).join(", "));
  const [focusAreas, setFocusAreas] = useState((profile?.focusAreas ?? []).join(", "));

  const upsertProfile = api.creator.upsertProfile.useMutation({
    onSuccess: async () => {
      await utils.creator.me.invalidate();
    },
  });

  const overviewQuery = api.project.contributorOverview.useQuery(undefined, {
    initialData: workSummary ?? undefined,
    refetchInterval: 90_000,
  });
  const contributorOverview = overviewQuery.data;
  const activeTasks = contributorOverview?.activeTasks ?? [];
  const payoutRequests = contributorOverview?.payoutRequests ?? [];
  const notifications = contributorOverview?.notifications ?? [];

  const creatorStats = useMemo(() => {
    const followerCount = profile?._count?.followers ?? 0;
    const followingCount = profile?._count?.following ?? 0;
    const postsCount = profile?._count?.feedPosts ?? 0;
    return { followerCount, followingCount, postsCount };
  }, [profile]);

  const currentMode = studioModes[mode];
  const materialOptions = studioMaterials[mode] ?? [];
  const selectedMaterial =
    materialOptions.find((option) => option.id === materialId) ?? materialOptions[0];

  useEffect(() => {
    const fallback = studioMaterials[mode]?.[0];
    if (!fallback) return;
    setMaterialId(fallback.id);
    setPrimaryImage(fallback.primaryImage);
    setOverlayImage(fallback.overlay);
    setPrimaryInput(fallback.primaryImage);
    setOverlayInput(fallback.overlay);
    setFinish(fallback.finish);
    setBackgroundTone(fallback.tone);
  }, [mode]);

  useEffect(() => {
    if (!selectedMaterial) return;
    setPrimaryImage(selectedMaterial.primaryImage);
    setOverlayImage(selectedMaterial.overlay);
    setPrimaryInput(selectedMaterial.primaryImage);
    setOverlayInput(selectedMaterial.overlay);
    setFinish(selectedMaterial.finish);
    setBackgroundTone(selectedMaterial.tone);
  }, [selectedMaterial]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    upsertProfile.mutate({
      handle,
      displayName: displayName || "Cloudus Creator",
      tagline: tagline || undefined,
      bio: bio || undefined,
      website: website || undefined,
      socialLinks: website ? [website] : [],
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      focusAreas: focusAreas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600">Creator studio</p>
            <h2 className="text-3xl font-semibold text-slate-900">
              Build the drop before you ship it.
            </h2>
            <p className="text-sm text-slate-600">
              Main window for live previews: pick your surface, drop artwork, set finish, and keep
              controls nearby. Great for print, audio, or video assets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(studioModes) as StudioMode[]).map((key) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  mode === key
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
                }`}
              >
                {studioModes[key]?.label ?? key}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 border-t border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 xl:grid-cols-[1.55fr,1fr]">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-slate-950 text-white shadow-2xl">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-200">Live design</p>
                  <p className="text-xl font-semibold">
                    {selectedMaterial?.name ?? "Surface"} / {currentMode.label}
                  </p>
                  <p className="text-sm text-slate-200">{selectedMaterial?.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {finish}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {currentMode.tagline}
                  </span>
                </div>
              </div>

              <div className="relative mt-2 aspect-[5/4] overflow-hidden px-2 pb-4">
                <div
                  className={`absolute inset-3 rounded-[26px] bg-gradient-to-br ${
                    backgroundTone === "dark"
                      ? "from-slate-900 via-slate-950 to-black"
                      : "from-slate-100 via-white to-slate-50"
                  }`}
                />
                <div
                  className="absolute inset-3 rounded-[26px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${primaryImage})` }}
                />
                <div className="absolute inset-3 rounded-[26px] bg-gradient-to-b from-black/20 via-black/5 to-black/30 mix-blend-multiply" />
                <div className="absolute inset-6 rounded-[28px] border-2 border-white/10 backdrop-blur-sm" />
                <div className="absolute left-1/2 top-1/2 h-[55%] w-[55%] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/5 p-3 shadow-[0_30px_60px_rgba(0,0,0,0.25)] backdrop-blur">
                  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/25 bg-slate-900/30 shadow-inner">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${overlayImage})`,
                        opacity: artworkOpacity / 100,
                        transform: `translate(-50%, -50%) translate(${artworkOffsetX}%, ${artworkOffsetY}%) scale(${artworkScale / 100}) rotate(${artworkRotation}deg)`,
                        left: "50%",
                        top: "50%",
                      }}
                    />
                    <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/50" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {currentMode.helper}
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <ControlCard
                  label="Artwork size"
                  value={`${artworkScale}%`}
                  tone="blue"
                  input={
                    <input
                      type="range"
                      min={40}
                      max={150}
                      step={1}
                      value={artworkScale}
                      onChange={(e) => setArtworkScale(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  }
                />
                <ControlCard
                  label="X offset"
                  value={`${artworkOffsetX}%`}
                  tone="slate"
                  input={
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      step={1}
                      value={artworkOffsetX}
                      onChange={(e) => setArtworkOffsetX(Number(e.target.value))}
                      className="w-full accent-slate-900"
                    />
                  }
                />
                <ControlCard
                  label="Y offset"
                  value={`${artworkOffsetY}%`}
                  tone="slate"
                  input={
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      step={1}
                      value={artworkOffsetY}
                      onChange={(e) => setArtworkOffsetY(Number(e.target.value))}
                      className="w-full accent-slate-900"
                    />
                  }
                />
                <ControlCard
                  label="Opacity"
                  value={`${artworkOpacity}%`}
                  tone="emerald"
                  input={
                    <input
                      type="range"
                      min={20}
                      max={100}
                      step={1}
                      value={artworkOpacity}
                      onChange={(e) => setArtworkOpacity(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  }
                />
                <ControlCard
                  label="Rotation"
                  value={`${artworkRotation} deg`}
                  tone="orange"
                  input={
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      step={1}
                      value={artworkRotation}
                      onChange={(e) => setArtworkRotation(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  }
                />
                <ControlCard
                  label="Finish"
                  value={finish}
                  tone="violet"
                  input={
                    <div className="flex flex-wrap gap-2">
                      {(["matte", "satin", "gloss"] as StudioMaterial["finish"][]).map((option) => (
                        <button
                          key={option}
                          onClick={() => setFinish(option)}
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                            finish === option
                              ? "bg-violet-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Artwork layer
                  </p>
                  <p className="text-sm text-slate-700">Drop a URL for the print/audio/video art.</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={overlayInput}
                      onChange={(e) => setOverlayInput(e.target.value)}
                      placeholder="https://your-artwork.jpg"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setOverlayImage(overlayInput)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Surface image
                  </p>
                  <p className="text-sm text-slate-700">
                    Swap the base photo: fabric, cover, or frame.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={primaryInput}
                      onChange={(e) => setPrimaryInput(e.target.value)}
                      placeholder="https://surface.jpg"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(primaryInput)}
                      className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200"
                    >
                      Swap
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-blue-50/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Mode vibe
                  </p>
                  <p className="text-sm text-slate-800">Tone the stage to match your piece.</p>
                  <div className="mt-2 flex gap-2">
                    {(["dark", "light"] as StudioMaterial["tone"][]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setBackgroundTone(tone)}
                        type="button"
                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          backgroundTone === tone
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {tone === "dark" ? "Night" : "Day"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Material shelf</p>
                  <p className="text-base font-semibold text-slate-900">{currentMode.helper}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {materialOptions.length} options
                </span>
              </div>
              <div className="mt-3 grid gap-3">
                {materialOptions.map((material) => (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => setMaterialId(material.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                      material.id === selectedMaterial?.id
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div
                      className="h-14 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-cover bg-center"
                      style={{ backgroundImage: `url(${material.primaryImage})` }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{material.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{material.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-slate-200"
                          style={{ backgroundColor: material.swatch }}
                        />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {material.finish}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-blue-200 bg-blue-50/80 p-4 text-sm text-slate-800 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-blue-700">Shots</p>
              <p className="font-semibold text-slate-900">Export to the feed or client review.</p>
              <p className="text-xs text-slate-600">
                Save this layout as a print-ready PNG, a mock player shot, or a frame preview.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Save mock
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-200"
                >
                  Queue for feed
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Followers" value={creatorStats.followerCount} />
        <StatPill label="Following" value={creatorStats.followingCount} />
        <StatPill label="Posts" value={creatorStats.postsCount} />
        <div className="rounded-2xl bg-emerald-50/70 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Creator earnings</p>
          <p className="text-2xl font-semibold text-emerald-800">
            {formatCurrency(earnings?.availableCents ?? 0)}
          </p>
          <p className="text-xs text-emerald-700">
            {formatCurrency(earnings?.lockedCents ?? 0)} pending approval
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
        <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Profile</p>
              <h2 className="text-xl font-semibold text-gray-900">Looks great in the feed</h2>
            </div>
            <Link
              href="/feed"
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700"
            >
              Preview feed
            </Link>
          </div>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Handle</label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                placeholder="my-handle"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                placeholder="Cloudus Creator"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Tagline</label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                placeholder="Creator of Cloudus experiences."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                placeholder="Share what you build, collab on, or ship."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Website</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Skills</label>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                placeholder="Product, Media, Ops"
              />
              <p className="text-xs text-gray-500">Comma separated.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Focus areas</label>
              <input
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                placeholder="Laundry, Commerce, Logistics"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={upsertProfile.isPending}
                className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {upsertProfile.isPending ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Recent feed stories</p>
              <h2 className="text-lg font-semibold text-gray-900">Inspiration from the studio</h2>
            </div>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700"
            >
              <SparklesIcon className="h-4 w-4" />
              Go to feed
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {recentFeed.slice(0, 4).map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-blue-50 bg-blue-50/60 p-4 text-sm text-gray-700"
              >
                <p className="text-xs uppercase text-gray-500">{post.type.replaceAll("_", " ")}</p>
                <p className="text-base font-semibold text-gray-900">
                  {post.title ?? post.project?.name ?? "Untitled drop"}
                </p>
                {post.caption && <p className="mt-1 text-gray-600 line-clamp-2">{post.caption}</p>}
                {post.project?.name && (
                  <Link
                    href={`/projects/${post.project.id}`}
                    className="mt-2 inline-flex text-xs font-semibold text-blue-700"
                  >
                    View project
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Active tasks</p>
                <h2 className="text-lg font-semibold text-gray-900">Keep work moving</h2>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {overviewQuery.isLoading ? "Updating..." : `${activeTasks.length} tasks`}
              </span>
            </div>
            {activeTasks.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                No tasks assigned. Claim briefs from the marketplace to get started.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activeTasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-2xl border border-blue-100 px-4 py-3 text-sm text-gray-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.project.name}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatCurrency(task.budgetCents)} budget
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/projects/${task.project.id}#tasks`}
                        className="inline-flex items-center rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        Update progress
                      </Link>
                      {task.status === "BACKLOG" && (
                        <Link
                          href={`/projects/${task.project.id}#tasks`}
                          className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
                        >
                          Claim task
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-gray-700">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Payouts and requests</p>
            {payoutRequests.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">
                No payout requests in review. Submit from a task once you deliver work.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {payoutRequests.map((request) => (
                  <li key={request.id} className="rounded-2xl bg-white/80 p-3 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">{request.task.title}</p>
                    <p className="text-xs text-gray-500">{request.task.project.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(request.amountCents)} / {request.status.toLowerCase()}
                    </p>
                    <Link
                      href={`/projects/${request.task.project.id}#tasks`}
                      className="mt-2 inline-flex text-xs font-semibold text-emerald-700"
                    >
                      View task
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-gray-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Notifications</p>
            <h2 className="text-lg font-semibold text-gray-900">Next steps</h2>
          </div>
          <span className="text-xs font-semibold text-gray-500">{notifications.length} alerts</span>
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No alerts right now. You will see approvals, payout updates, and concierge notes here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="rounded-2xl border border-gray-100 bg-white/80 p-3 shadow-sm"
              >
                <p className="font-semibold text-gray-900">{notification.title}</p>
                <p className="text-xs text-gray-500">{notification.body}</p>
                {notification.link && (
                  <Link
                    href={notification.link}
                    className="mt-1 inline-flex text-xs font-semibold text-blue-700"
                  >
                    View details
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <MarketplaceTasksPanel
        role="CREATOR"
        limit={4}
        title="Marketplace reminders"
        subtitle="Claim new briefs while you wait for approvals."
      />

      <section className="rounded-3xl border border-dashed border-gray-200 bg-white/90 p-6 text-sm text-gray-600 shadow-sm">
        <p>
          Need help publishing? Email{" "}
          <a href="mailto:support@cloudusdigital.com" className="font-semibold text-blue-700">
            support@cloudusdigital.com
          </a>{" "}
          or drop your assets via{" "}
          <a href="/uploader" className="font-semibold text-blue-700">
            /uploader
          </a>
          .
        </p>
        <p className="mt-2">
          Download your latest payout breakdown{" "}
          <a
            href="/api/creators/earnings/export"
            className="inline-flex items-center gap-1 font-semibold text-blue-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            CSV
          </a>
        </p>
      </section>
    </div>
  );
}

function ControlCard({
  label,
  value,
  tone,
  input,
}: {
  label: string;
  value: string;
  tone: "blue" | "slate" | "emerald" | "orange" | "violet";
  input: React.ReactNode;
}) {
  const toneMap: Record<"blue" | "slate" | "emerald" | "orange" | "violet", string> = {
    blue: "text-blue-700 bg-blue-50/70",
    slate: "text-slate-700 bg-slate-50/70",
    emerald: "text-emerald-700 bg-emerald-50/70",
    orange: "text-orange-700 bg-orange-50/70",
    violet: "text-violet-700 bg-violet-50/70",
  };

  return (
    <div className={`rounded-2xl border border-slate-200 p-3 ${toneMap[tone] ?? ""}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2">{input}</div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
