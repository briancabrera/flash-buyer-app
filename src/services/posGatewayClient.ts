import { apiFetch } from "../lib/api"

export type PosApiErrorPayload = {
  error: {
    code: string
    message: string
    request_id: string
  }
}

export class PosApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly requestId?: string
  readonly payload?: unknown

  constructor(args: { status: number; code?: string; message: string; requestId?: string; payload?: unknown }) {
    super(args.message)
    this.name = "PosApiError"
    this.status = args.status
    this.code = args.code
    this.requestId = args.requestId
    this.payload = args.payload
  }
}

export type PosGatewayRequestOptions = {
  idempotencyKey?: string
  body?: unknown
  /**
   * Extra headers. Only allowlisted headers are sent.
   */
  headers?: Record<string, string | undefined>
}

export type PosGatewayClientOptions = {
  baseUrl: string
  fetchImpl?: typeof fetch
}

export type PosGatewayResponse<T> = {
  data: T
  status: number
  /**
   * Response request id, if present.
   */
  requestId?: string
}

const HEADER_ALLOWLIST = new Set(["authorization", "idempotency-key", "content-type", "x-request-id"])

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "")
}

function buildUrl(baseUrl: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${normalizeBaseUrl(baseUrl)}${p}`
}

function safeJsonParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function pickAllowlistedHeaders(headers?: Record<string, string | undefined>) {
  const out: Record<string, string> = {}
  if (!headers) return out
  for (const [k, v] of Object.entries(headers)) {
    if (!v) continue
    const key = k.toLowerCase()
    if (HEADER_ALLOWLIST.has(key)) out[key] = v
  }
  return out
}

export function createPosGatewayClient(opts: PosGatewayClientOptions) {
  const fetchImpl = opts.fetchImpl ?? fetch
  const baseUrl = opts.baseUrl

  async function request<T>(method: string, path: string, options: PosGatewayRequestOptions = {}): Promise<PosGatewayResponse<T>> {
    const url = buildUrl(baseUrl, path)

    const headers: Record<string, string> = pickAllowlistedHeaders(options.headers)

    if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey

    // Si hay body, por default mandamos JSON.
    const hasBody = options.body !== undefined && options.body !== null && method.toUpperCase() !== "GET"
    if (hasBody && !headers["content-type"]) headers["content-type"] = "application/json"

    const res = await fetchImpl(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    })

    const requestId = res.headers.get("x-request-id") ?? undefined

    // Respuestas sin JSON (SSE / etc): por ahora usamos text y parseamos si se puede.
    const rawText = await res.text()
    const maybeJson = rawText ? safeJsonParse(rawText) : undefined

    if (!res.ok) {
      const payload = (maybeJson ?? (rawText ? { raw: rawText } : undefined)) as unknown

      const posPayload = (payload as Partial<PosApiErrorPayload>)?.error
      const code = posPayload?.code
      const message = posPayload?.message ?? `POS API error (${res.status})`
      const rid = posPayload?.request_id ?? requestId

      throw new PosApiError({ status: res.status, code, message, requestId: rid, payload })
    }

    return {
      data: (maybeJson as T) ?? (undefined as unknown as T),
      status: res.status,
      requestId,
    }
  }

  return { request }
}

export const posGatewayClient = createPosGatewayClient({
  baseUrl: import.meta.env.VITE_GATEWAY_URL ?? "",
  fetchImpl: apiFetch,
})

