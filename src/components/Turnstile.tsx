import Script from "next/script";

/** Widget anti-spam. Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no renderiza nada (desarrollo). */
export function Turnstile() {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!key) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile field" data-sitekey={key} data-language="es" />
    </>
  );
}
