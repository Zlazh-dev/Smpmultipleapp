import { getCurrentUser } from "@/lib/current-user";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PrintEditor } from "@/components/print-editor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  if (user.role !== "KHUSUS") return redirect("/dashboard");

  const { id } = await params;

  const template = await db.printTemplate.findUnique({ where: { id } });
  if (!template) return notFound();

  return (
    <PrintEditor
      templateId={template.id}
      initialData={template.canvasData as any}
      templateName={template.nama}
    />
  );
}
