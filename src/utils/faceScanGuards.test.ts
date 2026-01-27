import { describe, expect, it } from "vitest"
import { canStartFaceScan, getFaceScanAttempt } from "./faceScanGuards"

describe("faceScanGuards", () => {
  it("reuses idempotency key for same payload", () => {
    const first = getFaceScanAttempt({
      last: null,
      payload: "data:img",
      createKey: () => "idem-1",
    })
    const second = getFaceScanAttempt({
      last: first,
      payload: "data:img",
      createKey: () => "idem-2",
    })
    expect(second.idempotencyKey).toBe("idem-1")
  })

  it("blocks scan while scanning", () => {
    expect(canStartFaceScan("scanning")).toBe(false)
    expect(canStartFaceScan("sent")).toBe(false)
    expect(canStartFaceScan("idle")).toBe(true)
  })
})
