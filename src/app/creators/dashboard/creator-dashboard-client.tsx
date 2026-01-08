"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@heroicons/react/16/solid";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { UploadButton } from "~/utils/uploadthing";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

type CreatorMe = RouterOutputs["creator"]["me"];
type StudioMode = "print" | "branding" | "signage";

type StudioMaterial = {
  id: string;
  name: string;
  description: string;
  primaryImage: string;
  overlay: string;
  swatch: string;
  finish: "matte" | "gloss" | "satin";
  tone: "light" | "dark";
  priceCents: number;
  baseQty: number;
};

const studioModes: Record<StudioMode, { label: string; tagline: string; helper: string }> = {
  print: {
    label: "Print",
    tagline: "Business print essentials",
    helper: "Business cards, flyers, posters, brochures, menus.",
  },
  branding: {
    label: "Branding",
    tagline: "Identity and packaging",
    helper: "Logos, stationery, shop kits, labels, packaging.",
  },
  signage: {
    label: "Signage",
    tagline: "Large format and outdoor",
    helper: "Shop fronts, banners, vehicle wraps, window decals.",
  },
};

const studioMaterials: Record<StudioMode, StudioMaterial[]> = {
  print: [
    {
      id: "business-cards",
      name: "Business cards",
      description: "Premium 350gsm, matte or gloss, square or rounded corners.",
      primaryImage:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1000&q=80",
      swatch: "#1f2937",
      finish: "matte",
      tone: "light",
      priceCents: 16000,
      baseQty: 50,
    },
    {
      id: "flyers",
      name: "Flyers",
      description: "A5/A4 flyers for promos, events, and quick handouts.",
      primaryImage:
        "https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
      swatch: "#111827",
      finish: "satin",
      tone: "light",
      priceCents: 15000,
      baseQty: 50,
    },
    {
      id: "posters",
      name: "Posters",
      description: "A2/A1 posters with satin finish for vibrant color.",
      primaryImage:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=1000&q=80",
      swatch: "#0a0a0a",
      finish: "satin",
      tone: "dark",
      priceCents: 19000,
      baseQty: 1,
    },
    {
      id: "brochures",
      name: "Brochures",
      description: "Tri-fold or bi-fold brochures with sharp typography.",
      primaryImage:
        "https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1000&q=80",
      swatch: "#0f172a",
      finish: "gloss",
      tone: "light",
      priceCents: 20000,
      baseQty: 50,
    },
    {
      id: "menus",
      name: "Menus",
      description: "Cafe and restaurant menus with easy-to-read layout.",
      primaryImage:
        "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80",
      swatch: "#111827",
      finish: "matte",
      tone: "dark",
      priceCents: 17000,
      baseQty: 50,
    },
    {
      id: "apparel",
      name: "Branded apparel",
      description: "Tees, hoodies, caps, and uniforms with durable print.",
      primaryImage:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80",
      swatch: "#0f172a",
      finish: "matte",
      tone: "dark",
      priceCents: 22000,
      baseQty: 1,
    },
  ],
  branding: [
    {
      id: "logo-suite",
      name: "Logo suite",
      description: "Primary, secondary, and icon marks with spacing guides.",
      primaryImage:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
      swatch: "#0f172a",
      finish: "matte",
      tone: "dark",
      priceCents: 18000,
      baseQty: 1,
    },
    {
      id: "stationery",
      name: "Stationery set",
      description: "Letterheads, envelopes, and presentation folders.",
      primaryImage:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80",
      swatch: "#e2e8f0",
      finish: "satin",
      tone: "light",
      priceCents: 17000,
      baseQty: 50,
    },
    {
      id: "shop-branding",
      name: "Shop branding kit",
      description: "In-store signage, decals, and point-of-sale assets.",
      primaryImage:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1000&q=80",
      swatch: "#0b1224",
      finish: "gloss",
      tone: "dark",
      priceCents: 21000,
      baseQty: 1,
    },
    {
      id: "packaging",
      name: "Packaging labels",
      description: "Product labels, stickers, and barcode-ready sleeves.",
      primaryImage:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
      swatch: "#1f2937",
      finish: "matte",
      tone: "light",
      priceCents: 16000,
      baseQty: 50,
    },
  ],
  signage: [
    {
      id: "shop-front",
      name: "Shop front sign",
      description: "Exterior fascia boards with bold branding.",
      primaryImage:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
      overlay:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
      swatch: "#0b1224",
      finish: "gloss",
      tone: "dark",
      priceCents: 22000,
      baseQty: 1,
    },
    {
      id: "vehicle-branding",
      name: "Vehicle branding",
      description: "Full wraps and decals for fleet visibility.",
      primaryImage:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80",
      swatch: "#111827",
      finish: "gloss",
      tone: "dark",
      priceCents: 23000,
      baseQty: 1,
    },
    {
      id: "banners",
      name: "Banners",
      description: "Outdoor PVC banners for events and promotions.",
      primaryImage:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80",
      swatch: "#0f172a",
      finish: "satin",
      tone: "light",
      priceCents: 18000,
      baseQty: 1,
    },
    {
      id: "window-decals",
      name: "Window decals",
      description: "Frosted or full-color vinyl for glass surfaces.",
      primaryImage:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80",
      swatch: "#e2e8f0",
      finish: "matte",
      tone: "light",
      priceCents: 15000,
      baseQty: 1,
    },
    {
      id: "lightbox",
      name: "Lightbox signage",
      description: "Illuminated signage for storefronts and malls.",
      primaryImage:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
      overlay:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1000&q=80",
      swatch: "#111827",
      finish: "gloss",
      tone: "dark",
      priceCents: 21000,
      baseQty: 1,
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

function getUploadedUrl(files: unknown): string | undefined {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  const f = files[0] as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v : undefined);
  return (
    pick(f.url) ??
    pick(f.ufsUrl) ??
    pick((f.serverData as Record<string, unknown> | undefined)?.url) ??
    (pick(f.key) ? `https://utfs.io/f/${String(f.key)}` : undefined)
  );
}

const defaultMode: StudioMode = "print";
const defaultMaterial =
  studioMaterials[defaultMode]?.[0] ??
  studioMaterials.print?.[0] ??
  studioMaterials.branding?.[0] ??
  studioMaterials.signage?.[0];

export default function CreatorDashboardClient({
  initialProfile,
  recentFeed: _recentFeed,
  workSummary: _workSummary,
}: {
  initialProfile: CreatorMe;
  recentFeed: unknown[];
  workSummary?: unknown | null;
}) {
  const profile = initialProfile.profile;

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

  const handle = profile?.handle ?? "";
  const displayName = profile?.displayName ?? "";

  const [orderCustomerName, setOrderCustomerName] = useState(
    profile?.displayName ?? "",
  );
  const [orderCustomerPhone, setOrderCustomerPhone] = useState("");
  const [orderCustomerEmail, setOrderCustomerEmail] = useState("");
  const [orderAddressLine1, setOrderAddressLine1] = useState("");
  const [orderSuburb, setOrderSuburb] = useState("");
  const [orderCity, setOrderCity] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderDeliveryType, setOrderDeliveryType] = useState<"none" | "package" | "large">("package");
  const [orderQuantity, setOrderQuantity] = useState("50");
  const [orderWidth, setOrderWidth] = useState("");
  const [orderHeight, setOrderHeight] = useState("");
  const [orderBleed, setOrderBleed] = useState("3");
  const [orderSafeMargin, setOrderSafeMargin] = useState("5");
  const [orderColorMode, setOrderColorMode] = useState("CMYK");
  const [orderResolution, setOrderResolution] = useState("300");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderRedirecting, setOrderRedirecting] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const createStudioOrder = api.order.createStudioOrder.useMutation({
    onSuccess: async (order) => {
      setOrderSuccess("Order created. Redirecting to payment...");
      setOrderError(null);
      setOrderDialogOpen(true);
      setOrderRedirecting(true);
      try {
        const response = await fetch("/api/payments/paystack/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        const data = (await response.json().catch(() => null)) as
          | { checkoutUrl?: string; error?: string }
          | null;
        if (!response.ok || typeof data?.checkoutUrl !== "string") {
          throw new Error(data?.error ?? "Unable to start payment. Please try again.");
        }
        window.location.href = data.checkoutUrl;
      } catch (err) {
        setOrderRedirecting(false);
        setOrderDialogOpen(true);
        setOrderError(
          err instanceof Error ? err.message : "Payment error. Please try again.",
        );
      }
    },
  });

  const currentMode = studioModes[mode];
  const materialOptions = studioMaterials[mode] ?? [];
  const selectedMaterial =
    materialOptions.find((option) => option.id === materialId) ?? materialOptions[0];
  const quantityValue = Math.max(1, Number(orderQuantity) || 1);
  const baseQty = selectedMaterial?.baseQty ?? 1;
  const basePrice = selectedMaterial?.priceCents ?? 0;
  const materialTotalCents = Math.round((quantityValue / baseQty) * basePrice);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = src;
    });

  const createDesignPreview = async () => {
    if (!primaryImage || !overlayImage) return null;
    try {
      const width = 1200;
      const height = 960;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const base = await loadImage(primaryImage);
      const baseScale = Math.max(width / base.width, height / base.height);
      const baseW = base.width * baseScale;
      const baseH = base.height * baseScale;
      const baseX = (width - baseW) / 2;
      const baseY = (height - baseH) / 2;
      ctx.drawImage(base, baseX, baseY, baseW, baseH);

      const overlay = await loadImage(overlayImage);
      const maxW = width * 0.55;
      const maxH = height * 0.55;
      const fitScale = Math.min(maxW / overlay.width, maxH / overlay.height);
      const scale = fitScale * (artworkScale / 100);
      const drawW = overlay.width * scale;
      const drawH = overlay.height * scale;
      const offsetX = (artworkOffsetX / 100) * maxW;
      const offsetY = (artworkOffsetY / 100) * maxH;
      const centerX = width / 2 + offsetX;
      const centerY = height / 2 + offsetY;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((artworkRotation * Math.PI) / 180);
      ctx.globalAlpha = artworkOpacity / 100;
      ctx.drawImage(overlay, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  };

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

  const handleCreateOrder = async () => {
    setOrderError(null);
    setOrderSuccess(null);

    if (!selectedMaterial) {
      setOrderError("Select a material before creating the order.");
      return;
    }
    if (!orderCustomerName.trim() || !orderCustomerPhone.trim()) {
      setOrderError("Customer name and phone are required.");
      return;
    }

    let preview: string | null = null;
    if (previewRef.current) {
      try {
        const { toPng } = await import("html-to-image");
        preview = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      } catch {
        preview = null;
      }
    }
    if (!preview) {
      preview = await createDesignPreview();
    }
    if (!preview) {
      setOrderError("Unable to capture the design preview. Please try again.");
      return;
    }

    const deliveryCents =
      orderDeliveryType === "large" ? 25000 : orderDeliveryType === "package" ? 5000 : 0;

    createStudioOrder.mutate({
      customerName: orderCustomerName.trim(),
      customerPhone: orderCustomerPhone.trim(),
      customerEmail: orderCustomerEmail.trim() || undefined,
      addressLine1: orderAddressLine1.trim() || undefined,
      suburb: orderSuburb.trim() || undefined,
      city: orderCity.trim() || undefined,
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      priceCents: materialTotalCents,
      deliveryCents,
      image: preview,
      artworkUrl: overlayImage,
      notes:
        [
          orderNotes.trim(),
          `Quantity: ${quantityValue}`,
          orderWidth && orderHeight ? `Size: ${orderWidth} x ${orderHeight} mm` : "",
          orderBleed ? `Bleed: ${orderBleed} mm` : "",
          orderSafeMargin ? `Safe margin: ${orderSafeMargin} mm` : "",
          orderColorMode ? `Color: ${orderColorMode}` : "",
          orderResolution ? `Resolution: ${orderResolution} dpi` : "",
          handle ? `Creator: @${handle}` : displayName ? `Creator: ${displayName}` : "",
        ]
          .filter(Boolean)
          .join(" • ") || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <section className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl sm:min-h-[calc(100vh-3rem)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-6">
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
          <div className="flex flex-wrap items-center gap-3">
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
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Material</span>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm"
              >
                {materialOptions.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setOrderFormOpen(true)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Create order
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6">
            <div className="relative flex min-h-[60vh] flex-1 flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-slate-950 text-white shadow-2xl">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-200">Live design</p>
                  <p className="text-xl font-semibold">
                    {selectedMaterial?.name ?? "Surface"} / {currentMode.label}
                  </p>
                  <p className="text-sm text-slate-200">{selectedMaterial?.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMaterial?.priceCents ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      {formatCurrency(selectedMaterial.priceCents)}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {finish}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {currentMode.tagline}
                  </span>
                </div>
              </div>

              <div ref={previewRef} className="relative mt-2 flex-1 overflow-hidden px-2 pb-4">
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

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Design tools
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {[
                  {
                    name: "Canva",
                    href: "https://www.canva.com/",
                    logo: "https://www.canva.com/favicon.ico",
                  },
                  {
                    name: "Figma",
                    href: "https://www.figma.com/",
                    logo: "https://static.figma.com/app/icon/1/favicon.png",
                  },
                  {
                    name: "Photopea",
                    href: "https://www.photopea.com/",
                    logo: "https://www.photopea.com/favicon.ico",
                  },
                  {
                    name: "Pixlr",
                    href: "https://pixlr.com/",
                    logo: "https://pixlr.com/favicon.ico",
                  },
                  {
                    name: "Unsplash",
                    href: "https://unsplash.com/",
                    logo: "https://unsplash.com/favicon-32x32.png",
                  },
                  {
                    name: "Pexels",
                    href: "https://www.pexels.com/",
                    logo: "https://www.pexels.com/favicon.ico",
                  },
                ].map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-2 text-center text-xs text-slate-600"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tool.logo} alt="" className="h-6 w-6" />
                    </span>
                    <span className="font-semibold text-slate-800">{tool.name}</span>
                  </a>
                ))}
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
                  <p className="text-sm text-slate-700">
                    Upload your artwork or paste a URL.
                  </p>
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
                  <div className="mt-3">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        const url = getUploadedUrl(res);
                        if (url) {
                          setOverlayInput(url);
                          setOverlayImage(url);
                        }
                      }}
                      onUploadError={(error: Error) => alert(`ERROR: ${error.message}`)}
                    />
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
                  <div className="mt-3">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        const url = getUploadedUrl(res);
                        if (url) {
                          setPrimaryInput(url);
                          setPrimaryImage(url);
                        }
                      }}
                      onUploadError={(error: Error) => alert(`ERROR: ${error.message}`)}
                    />
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
      </section>

      <Dialog
        open={orderFormOpen}
        onClose={() => setOrderFormOpen(false)}
        className="relative z-40"
      >
        <DialogBackdrop className="fixed inset-0 bg-slate-900/60" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  Create order
                </DialogTitle>
                <p className="text-xs text-slate-500">
                  Capture the current preview and confirm print specs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrderFormOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Material</p>
                      <p className="text-base font-semibold text-slate-900">
                        {selectedMaterial?.name ?? "Select a material"}
                      </p>
                      <p className="text-xs text-slate-500">{selectedMaterial?.description}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className="font-semibold text-slate-900">
                        {selectedMaterial?.priceCents
                          ? `${formatCurrency(selectedMaterial.priceCents)} / ${baseQty}`
                          : "Price pending"}
                      </p>
                      <p>Base: {baseQty} items (small up to A4)</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Quantity</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        type="number"
                        min={1}
                        step={1}
                        className="w-28 rounded-full border border-slate-200 px-3 py-2 text-sm"
                      />
                      <span className="text-slate-500">
                        Total: {formatCurrency(materialTotalCents)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Delivery</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs">
                        <span>No delivery</span>
                        <span className="font-semibold">R0</span>
                        <input
                          type="radio"
                          name="studioDeliveryTypeModal"
                          value="none"
                          checked={orderDeliveryType === "none"}
                          onChange={() => setOrderDeliveryType("none")}
                          className="ml-2"
                        />
                      </label>
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs">
                        <span>Package</span>
                        <span className="font-semibold">R50</span>
                        <input
                          type="radio"
                          name="studioDeliveryTypeModal"
                          value="package"
                          checked={orderDeliveryType === "package"}
                          onChange={() => setOrderDeliveryType("package")}
                          className="ml-2"
                        />
                      </label>
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs">
                        <span>Large items</span>
                        <span className="font-semibold">R250</span>
                        <input
                          type="radio"
                          name="studioDeliveryTypeModal"
                          value="large"
                          checked={orderDeliveryType === "large"}
                          onChange={() => setOrderDeliveryType("large")}
                          className="ml-2"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Delivery fee:{" "}
                      {formatCurrency(
                        orderDeliveryType === "large"
                          ? 25000
                          : orderDeliveryType === "package"
                            ? 5000
                            : 0,
                      )}{" "}
                      - Total:{" "}
                      {formatCurrency(
                        materialTotalCents +
                          (orderDeliveryType === "large"
                            ? 25000
                            : orderDeliveryType === "package"
                              ? 5000
                              : 0),
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Print size (mm)</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={orderWidth}
                        onChange={(e) => setOrderWidth(e.target.value)}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Width"
                        className="w-24 rounded-full border border-slate-200 px-3 py-2 text-sm"
                      />
                      <span className="text-slate-500">x</span>
                      <input
                        value={orderHeight}
                        onChange={(e) => setOrderHeight(e.target.value)}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Height"
                        className="w-24 rounded-full border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Bleed and safe margin</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={orderBleed}
                        onChange={(e) => setOrderBleed(e.target.value)}
                        type="number"
                        min={0}
                        step={1}
                        className="w-20 rounded-full border border-slate-200 px-3 py-2 text-sm"
                      />
                      <span className="text-slate-500">mm bleed</span>
                      <input
                        value={orderSafeMargin}
                        onChange={(e) => setOrderSafeMargin(e.target.value)}
                        type="number"
                        min={0}
                        step={1}
                        className="w-20 rounded-full border border-slate-200 px-3 py-2 text-sm"
                      />
                      <span className="text-slate-500">mm safe</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Recommended: 3mm bleed, 5mm safe margin.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Color mode</p>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={orderColorMode}
                        onChange={(e) => setOrderColorMode(e.target.value)}
                        className="rounded-full border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="CMYK">CMYK</option>
                        <option value="RGB">RGB</option>
                        <option value="PANTONE">PANTONE</option>
                      </select>
                      <span className="text-slate-500">Resolution</span>
                      <input
                        value={orderResolution}
                        onChange={(e) => setOrderResolution(e.target.value)}
                        type="number"
                        min={72}
                        step={1}
                        className="w-20 rounded-full border border-slate-200 px-3 py-2 text-sm"
                      />
                      <span className="text-slate-500">dpi</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                    Recommended: CMYK color, 300dpi, print-ready PDF or PNG.
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={orderCustomerName}
                    onChange={(e) => setOrderCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={orderCustomerPhone}
                    onChange={(e) => setOrderCustomerPhone(e.target.value)}
                    placeholder="Phone / WhatsApp"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={orderCustomerEmail}
                    onChange={(e) => setOrderCustomerEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={orderAddressLine1}
                    onChange={(e) => setOrderAddressLine1(e.target.value)}
                    placeholder="Address line (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={orderSuburb}
                    onChange={(e) => setOrderSuburb(e.target.value)}
                    placeholder="Suburb (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={orderCity}
                    onChange={(e) => setOrderCity(e.target.value)}
                    placeholder="City (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Order notes (optional)"
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    We will capture the current preview and attach it to the order.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCreateOrder()}
                    disabled={createStudioOrder.isPending || orderRedirecting}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {createStudioOrder.isPending
                      ? "Creating order..."
                      : orderRedirecting
                        ? "Redirecting to payment..."
                        : "Create order"}
                  </button>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={orderDialogOpen}
        onClose={() => (!orderRedirecting ? setOrderDialogOpen(false) : null)}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <CheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle as="h3" className="mt-4 text-lg font-semibold text-gray-900">
                {orderError ? "Payment issue" : "Redirecting to payment"}
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600">
                {orderError ?? orderSuccess ?? "Hang tight while we launch a secure payment page."}
              </p>
              {orderError && (
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderDialogOpen(false)}
                    className="rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
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

