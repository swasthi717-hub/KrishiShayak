import { supabase } from "../lib/supabase";

export async function getFarmerProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (farmError) {
    throw farmError;
  }

  let crops = [];

  if (farm) {
    const { data: cropData, error: cropError } = await supabase
      .from("crops")
      .select("*")
      .eq("farm_id", farm.id);

    if (cropError) {
      throw cropError;
    }

    crops = cropData || [];
  }

  return {
    profile,
    farm,
    crops,
  };
}