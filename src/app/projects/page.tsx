import Link from "next/link";
import { MarketplaceTasksPanel } from "../_components/MarketplaceTasksPanel";
import { HydrateClient, api } from "~/trpc/server";
import { formatZarFromCents } from "~/lib/os/format";
import { Badge, Button, Card, EmptyState, PageHeader } from "~/components/os/primitives";

export default async function ProjectsPage() {
  const marketplace = await api.project.marketplace({ limit: 24 }).catch(() => []);
  const projects = marketplace ?? [];

  return (
    <HydrateClient>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Build together"
          title="Projects"
          description="Open briefs, tasks, and client work. Open a project to bid, claim a task, or pay."
          actions={<Button href="/projects/create">New project</Button>}
        />

        <MarketplaceTasksPanel role="CREATOR" title="Open tasks" />

        {projects.length === 0 ? (
          <EmptyState
            title="No public projects yet"
            description="Create a brief or check back after the next drop."
            action={<Button href="/projects/create" size="sm">Create project</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:bg-os-elevated">
                  <img src={project.image} alt="" className="mb-4 h-36 w-full rounded-2xl object-cover" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{project.name}</h2>
                      <p className="os-muted line-clamp-2">{project.description}</p>
                    </div>
                    <Badge>{project.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-os-muted">
                    <span>{project.openTaskCount ?? 0} open tasks</span>
                    <span>{formatZarFromCents(project.availableBudgetCents)}</span>
                    <span>{project._count?.contributors ?? 0} builders</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </HydrateClient>
  );
}
