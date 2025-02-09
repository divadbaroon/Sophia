import { createClient } from "@/utils/supabase/server";
import Navigation from "./Navigation";

export default async function NavigationWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return <Navigation user={user} />;
}