import { Suspense } from "react";

import { HireDesk } from "~/components/revenue/HireDesk";
import { PageHeader, SkeletonGrid } from "~/components/os/primitives";

export default function HirePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Hire" />
      <Suspense fallback={<SkeletonGrid count={9} />}>
        <HireDesk />
      </Suspense>
    </div>
  );
}
