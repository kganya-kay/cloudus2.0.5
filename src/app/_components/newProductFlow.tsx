"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
} from "@mui/material";

import { api } from "~/trpc/react";

const steps = ["Vision & goals", "Your details", "Budget & scope", "Review & launch"];

const products = [
  "Web Development",
  "Mobile App Development",
  "Printing Services",
  "Integration Services",
  "Digital Marketing",
  "SEO Services",
  "Content Writing",
  "Graphic Design",
  "UI/UX Design",
  "Photography",
  "Music Production",
];

const productInterestMap: Record<string, string> = {
  "Web Development": "1",
  "E-commerce Solutions": "3",
  "Printing Services": "4",
  "Integration Services": "5",
  "Mobile App Development": "6",
  "Digital Marketing": "10",
  "SEO Services": "11",
  "Content Writing": "7",
  "Graphic Design": "8",
  "UI/UX Design": "9",
  "Photography": "12",
  "Music Production": "13",
};

const money = (value?: number, currency = "ZAR") => {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `R ${(value / 100).toFixed(0)}`;
  }
};

type SubmissionResult = {
  projectId: number;
  projectStatus: string;
  projectPaymentId: string;
  depositAmountCents: number;
  depositPercent: number;
  depositCurrency: string;
  paymentPath: string;
};

export default function NewProductFlow() {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [idea, setIdea] = useState({
    title: "",
    goal: "",
    audience: "",
    success: "",
    launchType: products[0] ?? "Web Development",
    timeline: "",
  });
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    website: "",
  });
  const [budget, setBudget] = useState({
    total: "",
    depositPercent: 50,
    currency: "ZAR",
  });
  const [notes, setNotes] = useState("");
  const [aiCoaching, setAiCoaching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const assistant = api.assistant.ask.useMutation({
    onSuccess: (data) => setAiCoaching(data.answer),
    onError: () => setAiCoaching("Navigator is offline. Please try again soon."),
  });

  const launchConfigurator = api.project.launchConfigurator.useMutation({
    onSuccess: (payload) => {
      setSubmission(payload);
      setError(null);
      formRef.current?.requestSubmit();
    },
    onError: (err) => {
      setError(err.message ?? "We couldn't launch the project. Please try again.");
    },
  });

  const totalBudgetZar = useMemo(() => Number(budget.total) || 0, [budget.total]);
  const totalBudgetCents = useMemo(
    () => Math.max(0, Math.round(totalBudgetZar * 100)),
    [totalBudgetZar],
  );
  const depositCents = useMemo(
    () => Math.max(0, Math.round(totalBudgetCents * (budget.depositPercent / 100))),
    [totalBudgetCents, budget.depositPercent],
  );

  const resetWizard = () => {
    setActiveStep(0);
    setIdea({
      title: "",
      goal: "",
      audience: "",
      success: "",
      launchType: products[0] ?? "Web Development",
      timeline: "",
    });
    setContact({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      website: "",
    });
    setBudget({ total: "", depositPercent: 50, currency: "ZAR" });
    setNotes("");
    setAiCoaching(null);
    setError(null);
    setSubmission(null);
    setPaymentError(null);
    setPaymentLoading(false);
  };

  const handleOpen = () => {
    resetWizard();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      if (
        !idea.title.trim() ||
        !idea.goal.trim() ||
        !idea.audience.trim() ||
        !idea.success.trim() ||
        !idea.timeline.trim()
      ) {
        setError("Add your idea, goal, audience, success metric, and launch timeline to continue.");
        return false;
      }
    } else if (step === 1) {
      if (
        !contact.firstName.trim() ||
        !contact.lastName.trim() ||
        !contact.email.trim() ||
        !contact.phone.trim() ||
        !contact.company.trim()
      ) {
        setError("Please complete all contact fields so we can reach you.");
        return false;
      }
      if (!contact.email.includes("@")) {
        setError("Please enter a valid email address.");
        return false;
      }
    } else if (step === 2) {
      if (totalBudgetZar <= 0) {
        setError("Set a project budget so we can reserve the right team.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (submission) {
      handleClose();
      return;
    }
    if (!validateStep(activeStep)) return;
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      submitConfigurator();
    }
  };

  const handleBack = () => {
    if (submission || activeStep === 0) return;
    setActiveStep((prev) => prev - 1);
  };

  const submitConfigurator = () => {
    if (launchConfigurator.isPending) return;
    launchConfigurator.mutate({
      idea: {
        title: idea.title.trim(),
        goal: idea.goal.trim(),
        audience: idea.audience.trim(),
        success: idea.success.trim(),
        launchType: idea.launchType,
        timeline: idea.timeline.trim(),
        aiSummary: aiCoaching ?? undefined,
      },
      contact: {
        firstName: contact.firstName.trim(),
        lastName: contact.lastName.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        company: contact.company.trim(),
        website: contact.website.trim() || undefined,
      },
      budget: {
        totalZar: totalBudgetZar,
        currency: budget.currency,
        depositPercent: budget.depositPercent,
      },
      notes: notes.trim() || undefined,
    });
  };

  const startDepositCheckout = async () => {
    if (!submission?.projectPaymentId || paymentLoading) return;
    try {
      setPaymentError(null);
      setPaymentLoading(true);
      const response = await fetch("/api/projects/payments/paystack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: submission.projectPaymentId }),
      });
      const data = (await response.json().catch(() => null)) as
        | { checkoutUrl?: string; error?: string }
        | null;
      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error ?? "Unable to start payment. Please try again.");
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Unable to start deposit payment.");
      setPaymentLoading(false);
    }
  };

  const askNavigator = () => {
    if (!idea.goal.trim()) {
      setError("Describe your goal first, then ask the AI coach.");
      return;
    }
    setError(null);
    assistant.mutate({
      question: `We are designing a launch on /projects. Idea: ${idea.title}. Goal: ${idea.goal}. Audience: ${idea.audience}. Success metric: ${idea.success}. Timeline: ${idea.timeline}. Suggest next onboarding steps and where to navigate.`,
      path: "/launch-configurator",
    });
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="grid gap-6 md:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  What are we launching?
                </label>
                <input
                  type="text"
                  value={idea.title}
                  onChange={(e) => setIdea((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="E.g. Laundry-as-a-service, supplier marketplace, ops portal"
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Desired outcome
                </label>
                <textarea
                  value={idea.goal}
                  onChange={(e) => setIdea((prev) => ({ ...prev, goal: e.target.value }))}
                  rows={3}
                  placeholder="Explain the experience, workflow, or service you want Cloudus to deliver."
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    Primary audience
                  </label>
                  <input
                    type="text"
                    value={idea.audience}
                    onChange={(e) => setIdea((prev) => ({ ...prev, audience: e.target.value }))}
                    placeholder="SMBs, caretakers, riders, tenants..."
                    className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    Success metric
                  </label>
                  <input
                    type="text"
                    value={idea.success}
                    onChange={(e) => setIdea((prev) => ({ ...prev, success: e.target.value }))}
                    placeholder="e.g. 200 paying customers, launch in 4 weeks"
                    className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    Launch timeline
                  </label>
                  <input
                    type="text"
                    value={idea.timeline}
                    onChange={(e) => setIdea((prev) => ({ ...prev, timeline: e.target.value }))}
                    placeholder="By next quarter, ASAP, phased rollout..."
                    className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    Squad focus
                  </label>
                  <select
                    value={idea.launchType}
                    onChange={(e) => setIdea((prev) => ({ ...prev, launchType: e.target.value }))}
                    className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {products.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Additional context (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Share integrations, compliance needs, or previous attempts."
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Cloudus Navigator
                  </p>
                  <p className="text-xs text-gray-600">
                    Our deterministic AI tour guide scans your answers and highlights the next best
                    action inside /projects, /suppliers, or /drivers.
                  </p>
                </div>
                <Button
                  size="small"
                  variant="contained"
                  onClick={askNavigator}
                  disabled={assistant.isPending}
                  className="!rounded-full !bg-blue-600 !text-white hover:!bg-blue-700"
                >
                  {assistant.isPending ? "Thinking..." : "Ask Navigator"}
                </Button>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-white/80 p-4 text-sm text-gray-800">
                {assistant.isPending
                  ? "Summarising your idea..."
                  : aiCoaching ?? 'Share your idea, then tap "Ask Navigator" for curated guidance.'}
              </div>
              <ul className="list-disc space-y-2 pl-4 text-xs text-gray-600">
                <li>Navigator never hallucinates routes -- it only links to real Cloudus sections.</li>
                <li>Use it to discover where to manage suppliers, drivers, or delivery flows.</li>
              </ul>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid gap-6 md:grid-cols-[1.2fr,0.8fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">First name</label>
                <input
                  type="text"
                  value={contact.firstName}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Last name</label>
                <input
                  type="text"
                  value={contact.lastName}
                  onChange={(e) => setContact((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Email</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Company</label>
                <input
                  type="text"
                  value={contact.company}
                  onChange={(e) => setContact((prev) => ({ ...prev, company: e.target.value }))}
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Website / deck (optional)
                </label>
                <input
                  type="url"
                  value={contact.website}
                  onChange={(e) => setContact((prev) => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm text-gray-700">
              <p className="text-sm font-semibold text-gray-900">Why we ask</p>
              <p className="mt-1 text-xs text-gray-600">
                We sync these details with our lead system and your Cloudus project so ops, sales,
                and delivery teams can align on next steps.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-600">
                <li>- Instant lead (same fields as /contact-sales)</li>
                <li>- New /projects workspace tagged with your organisation</li>
                <li>- Human follow-up within 24h to confirm scope & deposit</li>
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                Already have an account?{" "}
                <Link href="/auth/signin" className="font-semibold text-blue-700 underline">
                  Sign in
                </Link>{" "}
                so the configurator links to your dashboard automatically.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Total project budget (ZAR)
                </label>
                <input
                  type="number"
                  min={1}
                  value={budget.total}
                  onChange={(e) => setBudget((prev) => ({ ...prev, total: e.target.value }))}
                  placeholder="e.g. 125000"
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Deposit commitment ({budget.depositPercent}%)
                </label>
                <input
                  type="range"
                  min={50}
                  max={90}
                  step={5}
                  value={budget.depositPercent}
                  onChange={(e) =>
                    setBudget((prev) => ({ ...prev, depositPercent: Number(e.target.value) }))
                  }
                  className="w-full accent-blue-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Projects stay inactive until a minimum 50% deposit is paid. Increase the slider if
                  you want to pre-pay more of the scope.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">Total budget</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {totalBudgetCents ? money(totalBudgetCents, budget.currency) : "R 0"}
                </p>
                <p className="text-xs text-gray-500">We split tasks across design, build, and ops.</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                <p className="text-xs font-semibold uppercase text-blue-700">
                  Deposit due ({budget.depositPercent}%)
                </p>
                <p className="mt-1 text-2xl font-semibold text-blue-900">
                  {depositCents ? money(depositCents, budget.currency) : "R 0"}
                </p>
                <p className="text-xs text-blue-900">
                  Unlocks the project workspace, supplier sourcing, and task allocations.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-700">Balance</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">
                  {money(Math.max(totalBudgetCents - depositCents, 0), budget.currency)}
                </p>
                <p className="text-xs text-emerald-800">
                  Pay as tasks are approved or upfront once scope is locked.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-gray-600">
              <p>
                We route your deposit to the dedicated project payment portal so you can pay via card or
                EFT. Deposits are refundable before production starts.
              </p>
            </div>
          </div>
        );
      default:
        if (submission) {
          return (
            <div className="space-y-5 text-center">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-emerald-600">All set</p>
                <h4 className="text-2xl font-semibold text-gray-900">
                  Project #{submission.projectId} is waiting for payment
                </h4>
                <p className="text-sm text-gray-600">
                  Status: {submission.projectStatus}. We emailed next steps and pinned the project in
                  /projects.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-left shadow-sm">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Deposit required now ({submission.depositPercent}%)
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">
                  {money(submission.depositAmountCents, submission.depositCurrency)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Paying the deposit activates your tasks, supplier sourcing, and driver routing.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={startDepositCheckout}
                    disabled={paymentLoading}
                    variant="contained"
                    className="!rounded-full !bg-blue-600 !px-5"
                  >
                    {paymentLoading ? "Launching checkout..." : "Pay deposit now"}
                  </Button>
                  <Button
                    component={Link}
                    href={submission.paymentPath}
                    target="_blank"
                    rel="noreferrer"
                    variant="contained"
                    className="!rounded-full !bg-emerald-600 !px-5"
                  >
                    Open payment workspace
                  </Button>
                  <Button
                    component={Link}
                    href={`/projects/${submission.projectId}`}
                    variant="outlined"
                    className="!rounded-full"
                  >
                    View project brief
                  </Button>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Payment reference: {submission.projectPaymentId}
                </p>
                {paymentError && (
                  <p className="mt-2 text-xs text-red-600">{paymentError}</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left text-sm text-gray-700">
                <p className="text-xs font-semibold uppercase text-gray-500">Project summary</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{idea.title}</p>
                <p className="mt-1 text-gray-700">{idea.goal}</p>
                <dl className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">Audience</dt>
                    <dd className="text-sm text-gray-800">{idea.audience}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">Success metric</dt>
                    <dd className="text-sm text-gray-800">{idea.success}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">Timeline</dt>
                    <dd className="text-sm text-gray-800">{idea.timeline}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">Budget</dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {money(totalBudgetCents, budget.currency)}
                    </dd>
                  </div>
                </dl>
                {notes && (
                  <p className="mt-3 text-xs text-gray-500">
                    Notes: <span className="text-gray-800">{notes}</span>
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Need assistance? WhatsApp{" "}
                <a href="https://wa.me/27640204765" className="font-semibold text-blue-700 underline">
                  +27 64 020 4765
                </a>{" "}
                or email{" "}
                <a href="mailto:info@cloudusdigital.com" className="font-semibold text-blue-700 underline">
                  info@cloudusdigital.com
                </a>
                .
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Idea</p>
              <p className="text-sm font-semibold text-gray-900">{idea.title}</p>
              <p className="mt-1 text-sm text-gray-600">{idea.goal}</p>
              <dl className="mt-3 grid gap-2 text-xs text-gray-500 md:grid-cols-3">
                <div>
                  <dt className="font-semibold text-gray-600">Audience</dt>
                  <dd>{idea.audience}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Success metric</dt>
                  <dd>{idea.success}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Timeline</dt>
                  <dd>{idea.timeline}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Contact</p>
              <p className="text-sm font-semibold text-gray-900">
                {contact.firstName} {contact.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {contact.email} · {contact.phone}
              </p>
              <p className="text-xs text-gray-500">{contact.company}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Budget</p>
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {money(totalBudgetCents, budget.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deposit ({budget.depositPercent}%)</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {money(depositCents, budget.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {money(Math.max(totalBudgetCents - depositCents, 0), budget.currency)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                We create a Paystack-ready project payment entry linked to your workspace for the deposit.
              </p>
            </div>
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        );
    }
  };
  return (
    <>
      <section className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-6 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-blue-500">Launch configurator</p>
          <h3 className="text-3xl font-semibold text-gray-900">
            Capture the idea, qualify the budget, and unlock your Cloudus project in four guided steps.
          </h3>
          <p className="text-sm text-gray-600">
            Every submission creates a lead, spins up a /projects workspace, and keeps the brief
            inactive until a 50% deposit is paid. An AI tour guide is embedded to keep customers oriented.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>- Track every CTA back to /projects, /suppliers, and /drivers dashboards.</li>
            <li>- Collect launch budgets, allocate tasks, and trigger payment workflows automatically.</li>
            <li>- Centralise customer comms via notifications, WhatsApp, and in-app assistant replies.</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button variant="contained" onClick={handleOpen} className="!rounded-full !bg-blue-600 !px-6">
              Launch configurator
            </Button>
            <Button component={Link} href="/projects" variant="outlined" className="!rounded-full !px-6">
              Browse live projects
            </Button>
            <Button component={Link} href="/calendar" variant="text" className="!rounded-full !text-blue-700">
              Book a discovery call
            </Button>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-sm text-gray-700">
          <p className="text-xs font-semibold uppercase text-blue-600">Flow overview</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Share your idea + timeline. Navigator suggests next steps across the site map.</li>
            <li>Confirm contact details so your systems + Cloudus stay in sync.</li>
            <li>Set the total budget. A deposit order (50% minimum) is generated automatically.</li>
            <li>Review, submit, and head to /projects/{`{id}`}/payment to pay and activate tasks.</li>
          </ol>
          <p className="text-xs text-gray-600">
            Prefer a concierge experience? Email{" "}
            <Link href="mailto:info@cloudusdigital.com" className="font-semibold text-blue-800 underline">
              info@cloudusdigital.com
            </Link>{" "}
            or WhatsApp{" "}
            <Link href="https://wa.me/27640204765" className="font-semibold text-blue-800 underline">
              +27 64 020 4765
            </Link>
            .
          </p>
        </div>
      </section>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <h1 className="text-center text-2xl font-semibold text-gray-900">Launch a Cloudus initiative</h1>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={Math.min(activeStep, steps.length - 1)} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {error && !submission && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mt-6">{renderStepContent()}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={launchConfigurator.isPending}>
            Close
          </Button>
          <Button onClick={handleBack} disabled={activeStep === 0 || submission !== null}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            color="primary"
            variant="contained"
            disabled={launchConfigurator.isPending && !submission}
            className="!rounded-full !px-6"
          >
            {submission
              ? "Done"
              : activeStep === steps.length - 1
                ? launchConfigurator.isPending
                  ? "Submitting..."
                  : "Launch project"
                : "Next"}
          </Button>
        </DialogActions>

        <form
          ref={formRef}
          action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00DWU00000LaXxh"
          method="POST"
          target="_blank"
          style={{ display: "none" }}
        >
          <input type="hidden" name="oid" value="00DWU00000LaXxh" />
          <input type="hidden" name="retURL" value="https://cloudusdigital.com" />
          <input type="text" name="first_name" value={contact.firstName} readOnly />
          <input type="text" name="last_name" value={contact.lastName} readOnly />
          <input type="email" name="email" value={contact.email} readOnly />
          <input type="tel" name="phone" value={contact.phone} readOnly />
          <input type="text" name="company" value={contact.company} readOnly />
          <textarea
            name="description"
            value={`${idea.goal}\nTimeline: ${idea.timeline}\nBudget: ${money(totalBudgetCents, budget.currency)}\nNotes: ${notes}`}
            readOnly
          />
          <input
            type="hidden"
            name="00NWU00000PVzIh"
            value={productInterestMap[idea.launchType] ?? ""}
            readOnly
          />
        </form>
      </Dialog>
    </>
  );
}
