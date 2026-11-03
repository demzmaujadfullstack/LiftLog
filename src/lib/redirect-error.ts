export function isRedirectError(e: unknown): boolean {
  const err = e as { digest?: string; message?: string };
  return (
    typeof err?.digest === "string" &&
    (err.digest.startsWith("NEXT_REDIRECT") || err.digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}
