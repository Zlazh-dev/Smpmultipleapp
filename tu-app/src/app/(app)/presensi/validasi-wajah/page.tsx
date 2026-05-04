import { OpsPageHeader } from "@/components/ops/ops-page-header";
import { FaceValidationGallery } from "@/components/ops/face-validation-gallery";
import { getCurrentUser, isKhusus } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ValidasiWajahPage() {
  const user = await getCurrentUser();
  if (!user || !(await isKhusus())) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <OpsPageHeader
        title="Validasi Wajah"
        description="Verifikasi foto wajah yang diajukan oleh guru untuk presensi kehadiran."
      />

      <FaceValidationGallery />
    </div>
  );
}
