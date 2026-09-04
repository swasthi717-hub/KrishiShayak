import { supabase } from "../lib/supabase";

// ===============================
// SIGN UP
// ===============================
export const signUp = async ({
  fullName,
  email,
  phone,
  password,
}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        name: fullName,
        phone: phone || "",
        preferred_language: "hi",
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
};


// ===============================
// LOGIN
// ===============================
export const login = async (email, password) => {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw error;
  }

  return data;
};


// ===============================
// LOGOUT
// ===============================
export const logout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};


// ===============================
// GET CURRENT USER
// ===============================
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
};