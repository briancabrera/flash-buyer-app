import { getTerminalToken } from "./terminalTokenStore"

let cachedTerminalToken: string | null | undefined = undefined

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "")
}

function shouldAttachAuth(url: URL): boolean {
  // Always attach for relative `/pos/**` calls.
  if (url.pathname.startsWith("/pos/")) return true

  // Also attach for calls going to the configured gateway base URL.
  const base = (import.meta.env.VITE_GATEWAY_URL ?? "").trim()
  if (!base) return false
  const normalized = normalizeBaseUrl(base)
  return url.href.startsWith(normalized)
}

async function getTokenCached(): Promise<string | null> {
  if (cachedTerminalToken !== undefined) return cachedTerminalToken
  cachedTerminalToken = await getTerminalToken()
  return cachedTerminalToken
}

export function invalidateTerminalTokenCache(): void {
  cachedTerminalToken = undefined
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const req = input instanceof Request ? input : undefined
  const origin =
    typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "http://localhost"
  const url = new URL(req ? req.url : String(input), origin)

  // Start from existing headers (including a Request's headers).
  const merged = new Headers(req?.headers ?? undefined)
  if (init.headers) new Headers(init.headers).forEach((v, k) => merged.set(k, v))

  // Only inject Authorization if needed and not already present.
  if (shouldAttachAuth(url) && !merged.has("authorization")) {
    const token = await getTokenCached()
    if (token) merged.set("authorization", `Bearer ${token}`)
  }

  // Keep the Request as base to preserve signal/method/body defaults if present.
  const finalInit: RequestInit = {
    ...init,
    headers: merged,
  }

  return await fetch(req ?? input, finalInit)
}

