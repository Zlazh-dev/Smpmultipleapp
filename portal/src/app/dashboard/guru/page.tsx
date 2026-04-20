import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GuruManager } from "@/components/guru-manager";

export default async function ManajemenGuruPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only RADIG (admin) can access
  const currentRole = (session.user as any).role;
  if (currentRole !== "RADIG") {
    redirect("/dashboard");
  }

  // Fetch initial data server-side
  const users = await db.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      nip: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      <GuruManager initialUsers={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
