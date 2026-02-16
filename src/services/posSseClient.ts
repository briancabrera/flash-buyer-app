import { posGatewayClient } from "./posGatewayClient"

export type PosSseTicketResponse = {
  ticket: string
  /**
   * TTL in seconds (legacy / current in openapi.yaml).
   */
  expires_in_seconds?: number
  /**
   * Absolute expiry (some gateway versions).
   */
  expires_at?: string
}

export type TerminalSseEventName =
  | "connected"
  | "current_session"
  | "terminal_state"
  | "session_created"
  | "session_updated"
  | "session_closed"
  | "heartbeat"

export type TerminalSseConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "error"

export type TerminalSseReconnectReason = "401" | "network" | "unknown"

export type TerminalSseHandlers = {
  onStatus?: (s: TerminalSseConnectionStatus) => void
  onReconnect?: (info: { attempt: number; delayMs: number; reason: TerminalSseReconnectReason }) => void
  onEvent?: (evt: { type: TerminalSseEventName | "message"; data: unknown; raw: string }) => void
  onError?: (e: unknown) => void
}

export type PosSseClientOptions = {
  baseUrl: string
  createTicket?: () => Promise<{ ticket: string; expiresAtMs: number }>
  eventSourceFactory?: (url: string) => EventSource
  fetchImpl?: typeof fetch
  now?: () => number
  rand?: () => number
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "")
}

function buildSseUrl(baseUrl: string, ticket: string) {
  return `${normalizeBaseUrl(baseUrl)}/pos/terminals/events?ticket=${encodeURIComponent(ticket)}`
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

async function defaultCreateTicket() {
  const { data } = await posGatewayClient.request<PosSseTicketResponse>("POST", "/pos/terminals/events-ticket")
  const nowMs = Date.now()
  const expiresAtMs =
    data.expires_at ? Date.parse(data.expires_at) : nowMs + (data.expires_in_seconds ?? 120) * 1000
  return { ticket: data.ticket, expiresAtMs }
}

export function createPosSseClient(opts: PosSseClientOptions) {
  const createTicket = opts.createTicket ?? defaultCreateTicket
  const eventSourceFactory = opts.eventSourceFactory ?? ((url) => new EventSource(url))
  const fetchImpl = opts.fetchImpl ?? fetch
  const now = opts.now ?? (() => Date.now())
  const rand = opts.rand ?? (() => Math.random())
  const baseUrl = opts.baseUrl

  async function createTerminalEventsTicket() {
    return await createTicket()
  }

  function openTerminalEvents(ticket: string) {
    const url = buildSseUrl(baseUrl, ticket)
    return eventSourceFactory(url)
  }

  /**
   * Subscribe always-on to terminal SSE.
   *
   * Guarantees:
   * - NO crea ticket en loop: reusa el ticket hasta expiry.
   * - Reconnect: si se corta, reabre con el mismo ticket mientras sea válido.
   * - Si detecta 401 (ticket inválido/expirado), pide ticket nuevo y reconecta.
   */
  function subscribeTerminalEvents(handlers: TerminalSseHandlers) {
    let stopped = false
    let es: EventSource | null = null
    let ticket: string | null = null
    let expiresAtMs = 0
    let forceNewTicket = false

    let reconnectAttempt = 0
    let reconnectTimer: number | null = null
    let refreshTimer: number | null = null

    const setStatus = (s: TerminalSseConnectionStatus) => handlers.onStatus?.(s)

    const clearRefreshTimer = () => {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer)
        refreshTimer = null
      }
    }

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const closeEs = () => {
      try {
        es?.close()
      } catch {
        // ignore
      }
      es = null
    }

    const isTicketValid = () => !!ticket && now() < expiresAtMs

    const backoffDelay = (attempt: number) => {
      // exponential backoff with jitter; cap 15s
      const base = 500
      const cap = 15_000
      const exp = Math.min(cap, base * 2 ** Math.max(0, attempt - 1))
      const jitter = 0.7 + 0.6 * rand() // 0.7..1.3
      return Math.round(exp * jitter)
    }

    const ensureTicket = async () => {
      if (stopped) return

      const scheduleProactiveRefresh = () => {
        clearRefreshTimer()
        const ttlMs = expiresAtMs - now()
        if (Number.isFinite(ttlMs) && ttlMs > 0) {
          const refreshDelay = Math.max(1, Math.floor(ttlMs * 0.8))
          refreshTimer = window.setTimeout(() => {
            if (stopped) return
            // swap limpio: pedir ticket nuevo sin cerrar el stream actual
            forceNewTicket = true
            clearReconnectTimer()
            // disparar connect (sin tight loop; falla -> scheduleReconnect con backoff)
            void connect()
          }, refreshDelay)
        }
      }

      if (!forceNewTicket && isTicketValid()) {
        // ticket válido: asegurar refresh proactivo programado
        if (refreshTimer === null) scheduleProactiveRefresh()
        return
      }

        const t = await createTerminalEventsTicket()
      ticket = t.ticket
      expiresAtMs = t.expiresAtMs
      forceNewTicket = false

      // programar refresh proactivo al ~80% del TTL, sin polling
      scheduleProactiveRefresh()
    }

    const preflightTicket = async () => {
      if (!ticket) return { ok: false, status: 0 }
      try {
        const url = buildSseUrl(baseUrl, ticket)
        const res = await fetchImpl(url, { method: "GET", headers: { accept: "text/event-stream" } })
        return { ok: res.ok, status: res.status }
      } catch {
        return { ok: false, status: 0 }
      }
    }

    const classifyReasonFromStatus = (status: number): TerminalSseReconnectReason => {
      if (status === 401) return "401"
      if (status === 0) return "network"
      return "unknown"
    }

    const classifyReasonFromError = (e: unknown): TerminalSseReconnectReason => {
      if (e instanceof TypeError) return "network"
      return "unknown"
    }

    const scheduleReconnect = (reason: TerminalSseReconnectReason) => {
      if (stopped) return
      clearReconnectTimer()

      reconnectAttempt += 1
      const delay = backoffDelay(reconnectAttempt)
      setStatus("reconnecting")
      handlers.onReconnect?.({ attempt: reconnectAttempt, delayMs: delay, reason })
      reconnectTimer = window.setTimeout(() => {
        void connect()
      }, delay)
    }

    const connect = async () => {
      if (stopped) return
      clearReconnectTimer()
      try {
        setStatus(reconnectAttempt > 0 ? "reconnecting" : "connecting")

        await ensureTicket()
        if (!ticket) throw new Error("Missing SSE ticket")

        const preflight = await preflightTicket()
        if (preflight.status === 401) {
          // ticket inválido -> marcar refresh para el próximo intento
          forceNewTicket = true
          setStatus("error")
          scheduleReconnect("401")
          return
        }

        closeEs()
        es = openTerminalEvents(ticket)

        es.onopen = () => {
          reconnectAttempt = 0
          setStatus("connected")
        }

        es.onerror = (evt) => {
          handlers.onError?.(evt)
          if (stopped) return
          // Cerrar y chequear si el ticket quedó inválido (401) para decidir si re-adquirir.
          void (async () => {
            setStatus("error")
            closeEs()
            clearRefreshTimer()
            const check = await preflightTicket()
            if (check.status === 401) forceNewTicket = true
            scheduleReconnect(classifyReasonFromStatus(check.status))
          })()
        }

        es.onmessage = (evt) => {
          handlers.onEvent?.({ type: "message", data: safeJsonParse(evt.data), raw: evt.data })
        }

        const attach = (type: TerminalSseEventName) => {
          es?.addEventListener(type, (e) => {
            const msg = e as MessageEvent
            handlers.onEvent?.({ type, data: safeJsonParse(msg.data), raw: msg.data })
          })
        }

        attach("connected")
        attach("current_session")
        attach("terminal_state")
        attach("session_created")
        attach("session_updated")
        attach("session_closed")
        attach("heartbeat")
      } catch (e) {
        handlers.onError?.(e)
        setStatus("error")
        scheduleReconnect(classifyReasonFromError(e))
      }
    }

    void connect()

    return {
      getTicket: () => ticket,
      stop: () => {
        stopped = true
        clearReconnectTimer()
        clearRefreshTimer()
        closeEs()
        setStatus("idle")
      },
    }
  }

  return { createTerminalEventsTicket, openTerminalEvents, subscribeTerminalEvents }
}

export const posSseClient = createPosSseClient({
  baseUrl: import.meta.env.VITE_GATEWAY_URL ?? "",
})

