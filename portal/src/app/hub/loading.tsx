import { LoadingState } from "@/components/shared/loading-state";

export default function HubLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <LoadingState lines={5} />
    </div>
  );
}
