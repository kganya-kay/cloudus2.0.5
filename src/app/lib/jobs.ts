// lib/jobs.ts
export type Job = {
  id: string;
  slug: string;
  title: string;
  type: string;
  location: string;
  tags: string[];
  summary: string;
  description: string;
};

export const jobs: Job[] = [
  {
    id: "ops-caretaker-1",
    slug: "local-business-caretaker",
    title: "Local Business Caretaker",
    type: "Full-time • On-site",
    location: "Johannesburg • On-site",
    tags: ["Operations", "Laundry", "Customer Service", "POS"],
    summary:
      "Own day-to-day operations: open/close, record sales, run the laundry service, and serve clients end-to-end.",
    description:
      "Responsibilities: open and close the shop, operate POS and record daily sales, manage cash-up and reconciliation, run the laundry workflow (intake, tagging, washing/drying/pressing, pickups/collections), handle walk-ins/phone/WhatsApp queries, perform stock checks and basic re-ordering, keep the premises tidy, and prepare simple weekly performance reports. Requirements: reliable transport, strong people skills, basic computer literacy (spreadsheets, WhatsApp), comfort working some weekends/public holidays."
  },
];

export function getJobBySlug(slug: string) {
  return jobs.find((j) => j.slug === slug) ?? null;
}
