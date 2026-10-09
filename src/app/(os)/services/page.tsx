import { Suspense } from "react";

import { ServiceDesk } from "~/components/revenue/ServiceDesk";
import { PageHeader, SkeletonGrid } from "~/components/os/primitives";

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Every live Cloudus surface, delivered as a client service — with the same stack we run in production."
      />
      <Suspense fallback={<SkeletonGrid count={9} />}>
        <ServiceDesk />
      </Suspense>
    </div>
  );
}
