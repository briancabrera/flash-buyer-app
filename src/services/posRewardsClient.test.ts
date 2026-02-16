import { describe, expect, it, vi } from "vitest"
import { listRewards } from "./posRewardsClient"

vi.mock("./posGatewayClient", () => {
  return {
    posGatewayClient: {
      request: vi.fn(async () => ({ data: { items: [] }, status: 200, requestId: "req-1" })),
    },
  }
})

describe("posRewardsClient", () => {
  it("listRewards calls GET /pos/rewards", async () => {
    const { posGatewayClient } = await import("./posGatewayClient")
    await listRewards()
    expect(posGatewayClient.request).toHaveBeenCalledWith("GET", "/pos/rewards")
  })

  it("listRewards can pass session_id to compute can_redeem", async () => {
    const { posGatewayClient } = await import("./posGatewayClient")
    await listRewards("sess_123")
    expect(posGatewayClient.request).toHaveBeenCalledWith("GET", "/pos/rewards?session_id=sess_123")
  })
})
