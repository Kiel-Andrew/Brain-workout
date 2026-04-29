import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Checking workout_results...");
  const { data: results, error: rError } = await supabase
    .from("workout_results")
    .select(`*, users:user_id(*)`);
  
  if (rError) {
    console.error("Error fetching results:", rError);
    return;
  }

  console.log(`Found ${results.length} results.`);
  results.forEach((r, i) => {
    const user = r.users;
    console.log(`${i+1}. User: ${user?.full_name || 'NULL'} (ID: ${r.user_id}), Score: ${r.score}, Duration: ${r.duration_seconds}`);
  });

  console.log("\nChecking users...");
  const { data: users, error: uError } = await supabase.from("users").select("*");
  if (uError) {
    console.error("Error fetching users:", uError);
    return;
  }
  console.log(`Found ${users.length} users.`);
  users.forEach(u => console.log(`- ${u.full_name} (${u.email})`));
}

checkData();
