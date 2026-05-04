import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // KHUSUS → AsyOps, UMUM → AsyTeach
  if (user.accessLevel === "KHUSUS") {
    redirect("/dashboard");
  } else {
    redirect("/teach/home");
  }
}
