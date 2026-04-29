import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        fullName={profile?.full_name ?? user.email ?? "Admin"}
        isAdmin={true}
      />
      <div style={{ flex: 1, padding: "40px 48px", overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
