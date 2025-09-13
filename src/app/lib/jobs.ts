
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
    id: "sf-dev-1",
    slug: "sf-dev-1",
    title: "Salesforce Developer (Junior)",
    type: "Full-time",
    location: "Johannesburg • Hybrid",
    tags: ["Salesforce", "Apex", "LWC"],
    summary:
      "Build LWC/Apex features, automate deployments (Copado), and help implement client portals.",
    description:
      "You’ll collaborate with consultants and front-end engineers to deliver secure, scalable features in Salesforce (Apex/LWC). Responsibilities include writing tests, CI/CD (Copado), and onboarding to new client orgs."
  },
  {
    id: "fullstack-2",
    slug: "fullstack-2",
    title: "Full-Stack Engineer (Next.js)",
    type: "Contract / Remote",
    location: "Remote",
    tags: ["Next.js", "TypeScript", "Prisma"],
    summary:
      "Ship modern web apps on the T3 stack, integrate payments and external APIs.",
    description:
      "Own features across the stack with Next.js, tRPC, Prisma, and Tailwind. Work closely with design, implement integrations, and maintain quality with tests and code reviews."
  },
  {
    id: "crm-consult-1",
    slug: "crm-consult-1",
    title: "CRM Consultant (Salesforce)",
    type: "Part-time",
    location: "Johannesburg • On-site",
    tags: ["Sales Cloud", "App Builder", "Workflows"],
    summary:
      "Run discoveries, design scalable orgs, and guide clients through best practices.",
    description:
      "Lead client workshops, design data models and automation, and ensure governance/best practices. Prepare solution docs and support delivery teams through go-live."
  }
];

export function getJobBySlug(slug: string) {
  return jobs.find((j) => j.slug === slug) ?? null;
}
