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
  {
    id: "sf-dev-mid-1",
    slug: "salesforce-developer-intermediate",
    title: "Platform Developer (Intermediate)",
    type: "Full-time • Hybrid",
    location: "Johannesburg • Hybrid",
    tags: ["CRM", "APIs", "Integrations", "Automation", "Testing"],
    summary:
      "Build high-quality platform features, contribute tests, and support releases with CI/CD.",
    description:
      "Responsibilities: implement features in the CRM platform, build UI components and automations, write unit tests with meaningful coverage, optimize data queries and limits, collaborate with consultants/UX, participate in code reviews, assist with CI/CD. Requirements: 2–4 years platform dev experience, strong automation and data-model fundamentals, solid async/integration knowledge, Git familiarity. Nice to have: app builder experience, integration exposure (REST/Webhooks)."
  },
  {
    id: "sf-dev-sen-1",
    slug: "salesforce-developer-senior",
    title: "Senior Platform Developer",
    type: "Full-time • Hybrid/Remote",
    location: "Johannesburg • Hybrid/Remote",
    tags: ["CRM", "Architecture", "Integrations", "Leadership", "Automation"],
    summary:
      "Lead complex delivery across CRM initiatives, design integrations and patterns, and mentor the team.",
    description:
      "Responsibilities: own technical design and implementation for complex epics; architect scalable data models and integration patterns; enforce code quality and testing practices; guide reviews and mentor developers; collaborate with architects and product leads; contribute to release planning and risk management. Requirements: 5+ years platform engineering, deep automation/UI expertise, strong integration experience, proven leadership/mentorship. Nice to have: enterprise architecture exposure, advanced admin certification."
  }
];

export function getJobBySlug(slug: string) {
  return jobs.find((j) => j.slug === slug) ?? null;
}
