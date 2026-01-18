import { useSyncExternalStore } from "react"
import { posSseClient, type TerminalSseConnectionStatus, type TerminalSseEventName } from "../services/posSseClient"

export type TerminalSseState = {
  connectionStatus: TerminalSseConnectionStatus
  ticket: string | null
  /**
   * terminal_state metadata (never includes session)
   */
  terminalMeta: { merchant_id?: string; terminal_id?: string; status?: string } | null
  /**
   * Source of truth: active session snapshot (driven by SSE events).
   * Do NOT infer session from terminal_state.
   */
  activeSessionId: string | null
  activeSession: unknown | null
  lastEvent: { type: TerminalSseEventName | "message"; data: unknown; raw: string } | null
}

type Listener = () => void

const initialState: TerminalSseState = {
  connectionStatus: "idle",
  ticket: null,
  terminalMeta: null,
  activeSessionId: null,
  activeSession: null,
  lastEvent: null,
}
let state: TerminalSseState = initialState

let activeToken: string | null = null
let unsubscribe: (() => void) | null = null
let listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

function setState(patch: Partial<TerminalSseState>) {
  state = { ...state, ...patch }
  emit()
}

function getSessionId(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null
  return (snapshot as any).session_id ?? null
}

function setActiveSession(snapshot: unknown | null) {
  setState({
    activeSession: snapshot,
    activeSessionId: snapshot ? getSessionId(snapshot) : null,
  })
}

function setTerminalMeta(payload: unknown) {
  if (!payload || typeof payload !== "object") return
  const any = payload as any
  setState({
    terminalMeta: {
      merchant_id: any.merchant_id,
      terminal_id: any.terminal_id,
      status: any.status,
    },
  })
}

export function startTerminalSse(token: string) {
  if (!token) throw new Error("startTerminalSse requires a token")

  // Ya existe conexión para este token
  if (activeToken === token && unsubscribe) return

  // Token cambió: cerramos anterior
  stopTerminalSse()

  activeToken = token
  setState({ connectionStatus: "connecting", ticket: null })

  let subRef: { getTicket: () => string | null; stop: () => void } | null = null
  subRef = posSseClient.subscribeTerminalEvents(token, {
    onStatus: (s) => setState({ connectionStatus: s, ticket: subRef?.getTicket() ?? null }),
    onEvent: (evt) => {
      setState({ lastEvent: evt })

      // terminal_state: metadata only (no session snapshot anymore)
      if (evt.type === "terminal_state") {
        setTerminalMeta(evt.data)
        return
      }

      // bootstrap: current_session { session: SessionResponse | null }
      if (evt.type === "current_session") {
        if (evt.data && typeof evt.data === "object" && "session" in (evt.data as any)) {
          setActiveSession((evt.data as any).session ?? null)
        }
        return
      }

      // session_*: source of truth
      if (evt.type === "session_created" || evt.type === "session_updated") {
        const payload = evt.data
        const snap =
          payload && typeof payload === "object" && (payload as any).session && typeof (payload as any).session === "object"
            ? (payload as any).session
            : payload

        const snapId = getSessionId(snap)

        if (evt.type === "session_created") {
          // always switch to the new session
          setActiveSession(snap ?? null)
          return
        }

        // session_updated: ignore late updates for old sessions
        if (!state.activeSessionId) {
          // optional bootstrap: if no active session, accept the update
          setActiveSession(snap ?? null)
          return
        }

        if (snapId && snapId === state.activeSessionId) {
          setActiveSession(snap ?? null)
        }
        return
      }

      if (evt.type === "session_closed") {
        const payload = evt.data
        const closedId =
          payload && typeof payload === "object"
            ? ((payload as any).session_id ?? (payload as any).session?.session_id ?? null)
            : null
        if (closedId && closedId === state.activeSessionId) setActiveSession(null)
        return
      }
    },
    onError: () => {
      // errores se reflejan via status "error"/"reconnecting"
    },
  })

  unsubscribe = () => subRef?.stop()
}

export function stopTerminalSse() {
  try {
    unsubscribe?.()
  } finally {
    unsubscribe = null
    activeToken = null
    state = { ...initialState, connectionStatus: "idle" }
    emit()
  }
}

export function useTerminalSse(): TerminalSseState {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    () => state,
    () => state,
  )
}

