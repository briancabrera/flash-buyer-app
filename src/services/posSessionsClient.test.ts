import { describe, expect, it, vi } from "vitest"
import { redeemSelect, setReward } from "./posSessionsClient"

vi.mock("./posGatewayClient", () => {
  return {
    posGatewayClient: {
      request: vi.fn(async () => ({ data: { ok: true }, status: 200, requestId: "req-1" })),
    },
  }
})

describe("posSessionsClient", () => {
  it("setReward sends POST /pos/sessions/:id/reward with auth + idempotency", async () => {
    const { posGatewayClient } = await import("./posGatewayClient")
    await setReward("sess_1", { reward_id: "r1" }, "tok_1", "idem-1")
    expect(posGatewayClient.request).toHaveBeenCalledWith("POST", "/pos/sessions/sess_1/reward", {
      token: "tok_1",
      idempotencyKey: "idem-1",
      body: { reward_id: "r1" },
    })
  })

  it("redeemSelect sends POST /pos/sessions/:id/redeem/select with auth + idempotency", async () => {
    const { posGatewayClient } = await import("./posGatewayClient")
    await redeemSelect("sess_2", { reward_id: "r2" }, "tok_2", "idem-2")
    expect(posGatewayClient.request).toHaveBeenCalledWith("POST", "/pos/sessions/sess_2/redeem/select", {
      token: "tok_2",
      idempotencyKey: "idem-2",
      body: { reward_id: "r2" },
    })
  })
})
