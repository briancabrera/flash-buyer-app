import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./terminalTokenStore", () => {
  return {
    getTerminalToken: vi.fn(async () => "tok_test"),
  }
})

import { apiFetch, invalidateTerminalTokenCache } from "./api"

describe("apiFetch", () => {
  beforeEach(() => {
    invalidateTerminalTokenCache()
    ;(globalThis as any).fetch = vi.fn(async (_input: any, _init?: RequestInit) => {
      return new Response("", { status: 200 })
    })
  })

  it("injects Authorization for /pos/** requests", async () => {
    await apiFetch("/pos/rewards")
    const init = ((globalThis as any).fetch as any).mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("authorization")).toBe("Bearer tok_test")
  })

  it("does not overwrite Authorization if already set", async () => {
    await apiFetch("/pos/rewards", { headers: { authorization: "Bearer manual" } })
    const init = ((globalThis as any).fetch as any).mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("authorization")).toBe("Bearer manual")
  })

  it("does not inject Authorization for non-POS paths", async () => {
    await apiFetch("/api/health")
    const init = ((globalThis as any).fetch as any).mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("authorization")).toBeNull()
  })
})

