import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  if (isAdmin) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar
          fullName={profile?.full_name ?? user.email ?? "Admin"}
          isAdmin={true}
        />
        <main style={{ flex: 1, padding: "40px 48px", overflow: "auto" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        fullName={profile?.full_name ?? user.email ?? "Trainee"}
        isAdmin={false}
      />
      <main style={{ flex: 1, padding: "32px 24px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {children}
      </main>
    </div>
  );
}
