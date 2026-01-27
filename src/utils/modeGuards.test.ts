import { describe, expect, it } from "vitest"
import { getOrCreateModeRequest, markModeRequestStatus } from "./modeGuards"

describe("modeGuards", () => {
  it("blocks double call while sending for same session", () => {
    const map = new Map()
    const first = getOrCreateModeRequest({ map, sessionId: "s1", mode: "PURCHASE", createKey: () => "idem-1" })
    expect(first.shouldSend).toBe(true)

    const second = getOrCreateModeRequest({ map, sessionId: "s1", mode: "PURCHASE", createKey: () => "idem-2" })
    expect(second.shouldSend).toBe(false)
    expect(second.request.idempotencyKey).toBe("idem-1")
  })

  it("reuses idempotency key on retry for same mode after error", () => {
    const map = new Map()
    const first = getOrCreateModeRequest({ map, sessionId: "s1", mode: "REDEEM", createKey: () => "idem-1" })
    expect(first.shouldSend).toBe(true)
    markModeRequestStatus(map, "s1", "error")

    const retry = getOrCreateModeRequest({ map, sessionId: "s1", mode: "REDEEM", createKey: () => "idem-2" })
    expect(retry.shouldSend).toBe(true)
    expect(retry.request.idempotencyKey).toBe("idem-1")
  })

  it("after done, does not allow changing mode for same session", () => {
    const map = new Map()
    const first = getOrCreateModeRequest({ map, sessionId: "s1", mode: "REDEEM", createKey: () => "idem-1" })
    expect(first.shouldSend).toBe(true)
    markModeRequestStatus(map, "s1", "done")

    const second = getOrCreateModeRequest({ map, sessionId: "s1", mode: "PURCHASE", createKey: () => "idem-2" })
    expect(second.shouldSend).toBe(false)
    expect(second.request.idempotencyKey).toBe("idem-1")
  })
})

