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
  it("listRewards calls GET /pos/rewards with token", async () => {
    const { posGatewayClient } = await import("./posGatewayClient")
    await listRewards("tok_1")
    expect(posGatewayClient.request).toHaveBeenCalledWith("GET", "/pos/rewards", { token: "tok_1" })
  })
})
