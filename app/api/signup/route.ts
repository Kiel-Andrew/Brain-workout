import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, batchNumber } = body;

    // Validate inputs
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env vars");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Create admin client inside the handler (not at module level)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create auth user (admin API — skips email confirmation)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Upsert into public.users
    const { error: dbError } = await adminClient
      .from("users")
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        batch_number: batchNumber?.trim() || null,
        role: "user",
      });

    if (dbError) {
      console.error("DB error:", dbError);
      // Try to clean up the auth user
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to save user profile: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("Signup route error:", err);
    return NextResponse.json({ error: "Unexpected error: " + String(err) }, { status: 500 });
  }
}
