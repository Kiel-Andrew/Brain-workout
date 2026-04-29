import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearVisitorBatches() {
  console.log("Cleaning up visitor batches...");
  const { data, error, count } = await supabase
    .from('users')
    .update({ batch_number: null })
    .eq('role', 'visitor')
    .select('*', { count: 'exact' });

  if (error) {
    console.error("Error cleaning up:", error);
  } else {
    console.log(`Successfully cleared batch_number for ${count} visitors.`);
  }
}

clearVisitorBatches();
