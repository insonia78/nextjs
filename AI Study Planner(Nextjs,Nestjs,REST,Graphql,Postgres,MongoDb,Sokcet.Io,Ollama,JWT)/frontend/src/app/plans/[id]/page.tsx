import PlanDetailFeature from "@/features/plans/detail";

export default function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <PlanDetailFeature planId={params.id} />;
}
