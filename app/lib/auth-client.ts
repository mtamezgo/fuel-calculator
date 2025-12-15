import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  basePath: "/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Google OAuth helper
export const signInWithGoogle = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};
