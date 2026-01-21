export type PosBuyerState =
  | "idle"
  | "waiting_face"
  | "face_verified_purchase"
  | "face_verified_redeem"
  | "reward_selected"
  | "done"

type SessionSnapshot = {
  status?: string
  mode?: string
  redeem?: { reward_id?: string | null; voucher_code?: string | null } | null
}

export function derivePosBuyerState(snapshot: unknown): PosBuyerState {
  if (!snapshot || typeof snapshot !== "object") return "idle"
  const s = snapshot as SessionSnapshot
  const status = s.status ?? ""
  const mode = s.mode ?? ""

  if (status === "WAITING_FACE") return "waiting_face"
  if (status === "FACE_VERIFIED") {
    if (mode === "PURCHASE") return "face_verified_purchase"
    const hasReward = !!(s.redeem?.reward_id || s.redeem?.voucher_code)
    return hasReward ? "reward_selected" : "face_verified_redeem"
  }
  // After selecting a reward, backend may advance status beyond FACE_VERIFIED (e.g. READY_TO_CONFIRM).
  // On Buyer we still want the "waiting cashier" UI.
  if (mode === "REDEEM" && (status === "READY_TO_CONFIRM" || status === "WAITING_ACTION")) {
    return "reward_selected"
  }
  if (status === "CLOSED" || status === "EXPIRED") return "done"
  return "idle"
}
