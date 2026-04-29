import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
      <AdminNav />
      <div style={{ flex: 1, padding: "32px 32px", overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
