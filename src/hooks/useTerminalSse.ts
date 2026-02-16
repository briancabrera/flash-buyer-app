import { useSyncExternalStore } from "react"
import { posSseClient, type TerminalSseConnectionStatus, type TerminalSseEventName } from "../services/posSseClient"
import type { components } from "../../pos-api.types"

type SessionResponse = components["schemas"]["SessionResponse"]
type SessionStatus = NonNullable<SessionResponse["status"]>

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
  activeSession: SessionResponse | null
  lastEvent: { type: TerminalSseEventName | "message"; data: unknown; raw: string } | null
  /**
   * Last known terminal session end status for the most recently cleared session.
   * Needed because some backends clear the current session quickly (e.g. cancel deletes Redis),
   * and `session_closed` payloads may not include a full snapshot.
   */
  lastSessionEnd: { sessionId: string; status: SessionStatus } | null
}

type Listener = () => void

const initialState: TerminalSseState = {
  connectionStatus: "idle",
  ticket: null,
  terminalMeta: null,
  activeSessionId: null,
  activeSession: null,
  lastEvent: null,
  lastSessionEnd: null,
}
let state: TerminalSseState = initialState

let started = false
let unsubscribe: (() => void) | null = null
let listeners = new Set<Listener>()
const BOOTSTRAP_GRACE_MS = 2000
const WAITING_FACE_GRACE_MS = 5000
const END_STATUS_GRACE_MS = 7000
let lastSessionSeedAtMs = 0
let lastSessionClearedAtMs = 0
let lastClearedSessionId: string | null = null

function emit() {
  for (const l of listeners) l()
}

function setState(patch: Partial<TerminalSseState>) {
  state = { ...state, ...patch }
  emit()
}

function getSessionId(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null
  const id = (snapshot as Record<string, unknown>).session_id
  return typeof id === "string" ? id : null
}

function setActiveSession(snapshot: SessionResponse | null) {
  if (!snapshot) {
    lastSessionSeedAtMs = 0
    lastSessionClearedAtMs = Date.now()
    lastClearedSessionId = state.activeSessionId
  }
  setState({
    activeSession: snapshot,
    activeSessionId: snapshot ? getSessionId(snapshot) : null,
  })
}

function setLastSessionEnd(sessionId: string, status: SessionStatus) {
  setState({ lastSessionEnd: { sessionId, status } })
}

function setTerminalMeta(payload: unknown) {
  if (!payload || typeof payload !== "object") return
  const any = payload as Record<string, unknown>
  setState({
    terminalMeta: {
      merchant_id: typeof any.merchant_id === "string" ? any.merchant_id : undefined,
      terminal_id: typeof any.terminal_id === "string" ? any.terminal_id : undefined,
      status: typeof any.status === "string" ? any.status : undefined,
    },
  })
}

function coerceSessionSnapshot(payload: unknown): SessionResponse | null {
  if (!payload || typeof payload !== "object") return null
  const root = payload as Record<string, unknown>
  const maybeSession = root.session
  const snap = maybeSession && typeof maybeSession === "object" ? (maybeSession as Record<string, unknown>) : root
  const id = snap.session_id
  if (typeof id !== "string" || !id) return null
  return snap as unknown as SessionResponse
}

export function startTerminalSse() {
  if (started && unsubscribe) return

  // Ensure clean singleton state before starting.
  stopTerminalSse()
  started = true
  setState({ connectionStatus: "connecting", ticket: null })

  let subRef: { getTicket: () => string | null; stop: () => void } | null = null
  subRef = posSseClient.subscribeTerminalEvents({
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
        if (evt.data && typeof evt.data === "object" && "session" in (evt.data as Record<string, unknown>)) {
          const nextRaw = (evt.data as Record<string, unknown>).session ?? null
          const next = nextRaw ? coerceSessionSnapshot(nextRaw) : null
          if (next) lastSessionSeedAtMs = Date.now()
          setActiveSession(next)
        }
        return
      }

      // session_*: source of truth
      if (evt.type === "session_created" || evt.type === "session_updated") {
        const snap = coerceSessionSnapshot(evt.data)
        const snapId = snap?.session_id ?? null

        if (evt.type === "session_created") {
          // always switch to the new session
          lastSessionSeedAtMs = Date.now()
          setActiveSession(snap)
          return
        }

        // session_updated: ignore late updates for old sessions
        if (!state.activeSessionId) {
          const nowMs = Date.now()
          const recentlySeeded = nowMs - lastSessionSeedAtMs <= BOOTSTRAP_GRACE_MS
          const snapStatus = snap?.status ?? null
          const waitingFaceRecent =
            snapStatus === "WAITING_FACE" && nowMs - lastSessionClearedAtMs <= WAITING_FACE_GRACE_MS
          const endedStatusRecent =
            !!snapId &&
            snapId === lastClearedSessionId &&
            typeof snapStatus === "string" &&
            (snapStatus === "CANCELLED" || snapStatus === "CLOSED" || snapStatus === "EXPIRED" || snapStatus === "FAILED") &&
            nowMs - lastSessionClearedAtMs <= END_STATUS_GRACE_MS

          if (endedStatusRecent) {
            setLastSessionEnd(snapId, snapStatus as SessionStatus)
            return
          }
          if (recentlySeeded || waitingFaceRecent) {
            setActiveSession(snap)
          }
          return
        }

        if (snapId && snapId === state.activeSessionId) {
          setActiveSession(snap)
        }
        return
      }

      if (evt.type === "session_closed") {
        const payload = evt.data
        const rec = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null
        const nested = rec?.session && typeof rec.session === "object" ? (rec.session as Record<string, unknown>) : null
        const closedId = (rec?.session_id ?? nested?.session_id) as unknown
        const maybeStatus = (rec?.status ?? nested?.status) as unknown
        const activeStatus = state.activeSession?.status as unknown

        if (typeof closedId === "string" && typeof maybeStatus === "string") setLastSessionEnd(closedId, maybeStatus as SessionStatus)
        if (typeof closedId === "string" && maybeStatus == null && typeof activeStatus === "string") {
          setLastSessionEnd(closedId, activeStatus as SessionStatus)
        }

        if (typeof closedId === "string" && closedId === state.activeSessionId) setActiveSession(null)
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
    started = false
    lastSessionSeedAtMs = 0
    lastSessionClearedAtMs = 0
    lastClearedSessionId = null
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

