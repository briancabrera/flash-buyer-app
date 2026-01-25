import type { components } from "../../pos-api.types"

type SessionResponse = components["schemas"]["SessionResponse"]
type SessionStatus = NonNullable<SessionResponse["status"]>
type SessionMode = NonNullable<SessionResponse["mode"]>

export type PosBuyerState =
  | "idle"
  | "waiting_face"
  | "select_mode"
  | "face_verified_purchase"
  | "face_verified_redeem"
  | "reward_selected"
  | "cancelled"
  | "done"

export function derivePosBuyerState(snapshot: SessionResponse | null): PosBuyerState {
  if (!snapshot) return "idle"
  const status = (snapshot.status ?? "OPEN") as SessionStatus
  const mode = (snapshot.mode ?? "UNSET") as SessionMode

  if (status === "WAITING_FACE") return "waiting_face"
  if (status === "CANCELLED") return "cancelled"
  if (status === "FACE_VERIFIED") {
    if (mode === "UNSET") return "select_mode"
    if (mode === "PURCHASE") return "face_verified_purchase"
    // REDEEM
    const hasReward = !!(snapshot.redeem?.reward_id || snapshot.redeem?.voucher_code)
    return hasReward ? "reward_selected" : "face_verified_redeem"
  }

  // After choosing a mode / selecting a reward, backend may advance status beyond FACE_VERIFIED.
  // On Buyer we still want a "waiting cashier" UI.
  if (mode === "REDEEM" && (status === "READY_TO_CONFIRM" || status === "WAITING_ACTION" || status === "COMMITTING" || status === "COMMITTED")) {
    return "reward_selected"
  }
  if (mode === "PURCHASE" && (status === "WAITING_ACTION" || status === "READY_TO_CONFIRM" || status === "COMMITTING" || status === "COMMITTED")) {
    return "face_verified_purchase"
  }

  if (status === "CLOSED" || status === "EXPIRED") return "done"
  return "idle"
}
