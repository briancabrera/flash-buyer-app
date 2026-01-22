import { describe, expect, it } from "vitest"
import { derivePosBuyerState } from "./posBuyerState"

describe("derivePosBuyerState", () => {
  it("WAITING_FACE => waiting_face", () => {
    expect(derivePosBuyerState({ status: "WAITING_FACE", mode: "REDEEM" })).toBe("waiting_face")
  })

  it("FACE_VERIFIED PURCHASE => face_verified_purchase", () => {
    expect(derivePosBuyerState({ status: "FACE_VERIFIED", mode: "PURCHASE" })).toBe("face_verified_purchase")
  })

  it("FACE_VERIFIED REDEEM => face_verified_redeem when no reward", () => {
    expect(derivePosBuyerState({ status: "FACE_VERIFIED", mode: "REDEEM" })).toBe("face_verified_redeem")
  })

  it("FACE_VERIFIED REDEEM with reward => reward_selected", () => {
    expect(
      derivePosBuyerState({ status: "FACE_VERIFIED", mode: "REDEEM", redeem: { reward_id: "r1" } }),
    ).toBe("reward_selected")
  })

  it("REDEEM READY_TO_CONFIRM => reward_selected (waiting cashier)", () => {
    expect(derivePosBuyerState({ status: "READY_TO_CONFIRM", mode: "REDEEM" })).toBe("reward_selected")
  })

  it("CANCELLED => cancelled", () => {
    expect(derivePosBuyerState({ status: "CANCELLED", mode: "PURCHASE" })).toBe("cancelled")
  })
})
