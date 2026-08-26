const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

const authOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, authOptions);

const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  authOptions
);

function createUserClient(accessToken) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...authOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

module.exports = {
  supabase,
  supabaseAdmin,
  createUserClient,
};
