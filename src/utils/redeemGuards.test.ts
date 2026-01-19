import { describe, expect, it } from "vitest"
import { getOrCreateRewardRequest, markRewardRequestStatus } from "./redeemGuards"

describe("redeemGuards", () => {
  it("does not allow double-call after successful selection for same session", () => {
    const map = new Map()
    const first = getOrCreateRewardRequest({
      map,
      sessionId: "s1",
      rewardId: "r1",
      createKey: () => "idem-1",
    })
    expect(first.shouldSend).toBe(true)
    markRewardRequestStatus(map, "s1", "done")

    const second = getOrCreateRewardRequest({
      map,
      sessionId: "s1",
      rewardId: "r1",
      createKey: () => "idem-2",
    })
    expect(second.shouldSend).toBe(false)
    expect(second.request.idempotencyKey).toBe("idem-1")
  })

  it("reuses idempotency key on retry for same reward after error", () => {
    const map = new Map()
    const first = getOrCreateRewardRequest({
      map,
      sessionId: "s1",
      rewardId: "r1",
      createKey: () => "idem-1",
    })
    expect(first.shouldSend).toBe(true)
    markRewardRequestStatus(map, "s1", "error")

    const retry = getOrCreateRewardRequest({
      map,
      sessionId: "s1",
      rewardId: "r1",
      createKey: () => "idem-2",
    })
    expect(retry.shouldSend).toBe(true)
    expect(retry.request.idempotencyKey).toBe("idem-1")
  })
})
