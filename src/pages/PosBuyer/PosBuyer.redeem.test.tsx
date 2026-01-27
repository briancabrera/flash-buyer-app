import React from "react"
import { render, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import PosBuyer from "./PosBuyer"

const rewardsMocks = vi.hoisted(() => ({
  listRewardsWithMeta: vi.fn(async () => ({ items: [], status: 200, requestId: "req-1" })),
}))

vi.mock("../../services/posRewardsClient", () => {
  return { listRewardsWithMeta: rewardsMocks.listRewardsWithMeta }
})

vi.mock("../../hooks/useTerminalSse", () => {
  return {
    useTerminalSse: () => ({
      connectionStatus: "connected",
      ticket: "t1",
      terminalMeta: null,
      activeSessionId: "s1",
      activeSession: { session_id: "s1", mode: "REDEEM", status: "FACE_VERIFIED" },
      lastEvent: null,
    }),
    startTerminalSse: vi.fn(),
    stopTerminalSse: vi.fn(),
  }
})

describe("PosBuyer REDEEM", () => {
  it("loads rewards when REDEEM + FACE_VERIFIED", async () => {
    render(<PosBuyer />)
    await waitFor(() => {
      expect(rewardsMocks.listRewardsWithMeta).toHaveBeenCalled()
    })
  })
})
