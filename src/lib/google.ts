import { Google } from "arctic";

export function google() {
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret, NEXT_PUBLIC_SITE_URL: site } = process.env;
  if (!id || !secret) return null;
  return new Google(id, secret, `${site ?? "http://localhost:3000"}/auth/google/callback`);
}
