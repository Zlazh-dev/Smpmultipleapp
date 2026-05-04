import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GuruManager } from "@/components/guru-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users — Admin Console",
  description: "Manajemen pengguna AsyHub.",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
    <div className="flex flex-col h-[calc(100vh-110px)] px-6 lg:px-8 py-6">
      <GuruManager initialUsers={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
