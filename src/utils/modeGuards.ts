export type ModeRequestStatus = "sending" | "done" | "error"

export type ModeRequestState = {
  mode: "PURCHASE" | "REDEEM"
  idempotencyKey: string
  status: ModeRequestStatus
}

/**
 * Guardrails:
 * - Only one in-flight mode request per session (blocks double-taps / rapid switching while sending).
 * - After success, do not send again for that session.
 * - After error, allow retry; reuse idempotency key if retrying the same mode payload.
 * - If user changes mode after an error, generate a new key.
 */
export function getOrCreateModeRequest(args: {
  map: Map<string, ModeRequestState>
  sessionId: string
  mode: "PURCHASE" | "REDEEM"
  createKey: () => string
}): { request: ModeRequestState; shouldSend: boolean } {
  const { map, sessionId, mode, createKey } = args
  const existing = map.get(sessionId)
  if (!existing) {
    const request: ModeRequestState = { mode, idempotencyKey: createKey(), status: "sending" }
    map.set(sessionId, request)
    return { request, shouldSend: true }
  }

  // Block any further sends while we're in-flight or already done.
  if (existing.status === "sending" || existing.status === "done") {
    return { request: existing, shouldSend: false }
  }

  // error -> allow retry. Reuse key if same payload; new key if payload changed.
  if (existing.mode === mode) {
    existing.status = "sending"
    return { request: existing, shouldSend: true }
  }

  const request: ModeRequestState = { mode, idempotencyKey: createKey(), status: "sending" }
  map.set(sessionId, request)
  return { request, shouldSend: true }
}

export function markModeRequestStatus(map: Map<string, ModeRequestState>, sessionId: string, status: ModeRequestStatus) {
  const existing = map.get(sessionId)
  if (existing) existing.status = status
}

