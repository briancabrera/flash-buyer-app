import { describe, expect, it } from "vitest"
import { derivePosBuyerState } from "./posBuyerState"
import type { components } from "../../pos-api.types"

type SessionResponse = components["schemas"]["SessionResponse"]

function session(partial: Partial<SessionResponse>): SessionResponse {
  return partial as SessionResponse
}

describe("derivePosBuyerState", () => {
  it("WAITING_FACE => waiting_face", () => {
    expect(derivePosBuyerState(session({ status: "WAITING_FACE", mode: "REDEEM" }))).toBe("waiting_face")
  })

  it("FACE_VERIFIED PURCHASE => face_verified_purchase", () => {
    expect(derivePosBuyerState(session({ status: "FACE_VERIFIED", mode: "PURCHASE" }))).toBe("face_verified_purchase")
  })

  it("FACE_VERIFIED UNSET => select_mode", () => {
    expect(derivePosBuyerState(session({ status: "FACE_VERIFIED", mode: "UNSET" }))).toBe("select_mode")
  })

  it("FACE_VERIFIED REDEEM => face_verified_redeem when no reward", () => {
    expect(derivePosBuyerState(session({ status: "FACE_VERIFIED", mode: "REDEEM" }))).toBe("face_verified_redeem")
  })

  it("FACE_VERIFIED REDEEM with reward => reward_selected", () => {
    expect(
      derivePosBuyerState(session({ status: "FACE_VERIFIED", mode: "REDEEM", redeem: { reward_id: "r1" } })),
    ).toBe("reward_selected")
  })

  it("REDEEM READY_TO_CONFIRM => reward_selected (waiting cashier)", () => {
    expect(derivePosBuyerState(session({ status: "READY_TO_CONFIRM", mode: "REDEEM" }))).toBe("reward_selected")
  })

  it("CANCELLED => cancelled", () => {
    expect(derivePosBuyerState(session({ status: "CANCELLED", mode: "PURCHASE" }))).toBe("cancelled")
  })
})
