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
    title: "Salesforce Developer (Intermediate)",
    type: "Full-time • Hybrid",
    location: "Johannesburg • Hybrid",
    tags: ["Salesforce", "Apex", "LWC", "SOQL", "PD1"],
    summary:
      "Build high-quality features in Apex/LWC, contribute tests, and support releases with CI/CD.",
    description:
      "Responsibilities: implement features in Apex, LWC, and Flows; write unit tests with meaningful coverage; optimize SOQL and governor limits; collaborate with consultants/UX; participate in code reviews; assist with CI/CD (e.g., Copado/Git). Requirements: 2–4 years Salesforce dev experience, strong Apex/LWC fundamentals, solid SOQL/Async knowledge, Git familiarity, Platform Developer I preferred (or equivalent experience). Nice to have: App Builder, integration exposure (REST/Platform Events)."
  },
  {
    id: "sf-dev-sen-1",
    slug: "salesforce-developer-senior",
    title: "Senior Salesforce Developer",
    type: "Full-time • Hybrid/Remote",
    location: "Johannesburg • Hybrid/Remote",
    tags: ["Salesforce", "Apex", "LWC", "Architecture", "Integrations", "PDII"],
    summary:
      "Lead complex delivery across Sales/Service Cloud, design integrations and patterns, and mentor the team.",
    description:
      "Responsibilities: own technical design and implementation for complex epics; architect scalable data models and integration patterns (Apex, LWC, Platform Events, External Services); enforce code quality and testing practices; guide reviews and mentor developers; collaborate with architects and product leads; contribute to release planning and risk management. Requirements: 5+ years Salesforce engineering, deep Apex/LWC expertise, strong integration experience, proven leadership/mentorship. Nice to have: Platform Developer II, App Builder, OmniStudio or CTA track exposure."
  }
];

export function getJobBySlug(slug: string) {
  return jobs.find((j) => j.slug === slug) ?? null;
}
