import { describe, expect, it } from "vitest"
import { shouldAutoScan } from "./posAutoScanGuard"

describe("shouldAutoScan", () => {
  it("returns true only once per session in WAITING_FACE", () => {
    const sessionId = "s1"
    expect(
      shouldAutoScan({ activeSessionId: sessionId, activeSessionStatus: "WAITING_FACE", lastAutoScanSessionId: null }),
    ).toBe(true)

    expect(
      shouldAutoScan({
        activeSessionId: sessionId,
        activeSessionStatus: "WAITING_FACE",
        lastAutoScanSessionId: "s1",
      }),
    ).toBe(false)
  })

  it("returns false for non WAITING_FACE or missing session", () => {
    expect(
      shouldAutoScan({ activeSessionId: "s1", activeSessionStatus: "FACE_VERIFIED", lastAutoScanSessionId: null }),
    ).toBe(false)
    expect(
      shouldAutoScan({ activeSessionId: null, activeSessionStatus: "WAITING_FACE", lastAutoScanSessionId: null }),
    ).toBe(false)
  })
})
