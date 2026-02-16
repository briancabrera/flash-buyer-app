import { describe, expect, it, vi } from "vitest"
import { PosApiError } from "./posGatewayClient"
import { createPosFaceScanClient } from "./posFaceScanClient"

describe("posFaceScanClient", () => {
  it("builds URL and sends Idempotency-Key", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>
      return new Response(JSON.stringify({ ok: true, url, headers }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    })

    const client = createPosFaceScanClient({ baseUrl: "http://gw", fetchImpl: fetchMock as any })
    const res = await client.faceScan("sess_1", "data:image/jpeg;base64,aaa", "idem-1")

    expect(res.status).toBe(200)
    expect((res.data as any).url).toBe("http://gw/pos/sessions/sess_1/face-scan")
    expect((res.data as any).headers["idempotency-key"]).toBe("idem-1")
  })

  it("parses POS error payload into PosApiError", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: { code: "BIOMETRIC_TIMEOUT", message: "Timed out", request_id: "req-99" },
        }),
        { status: 504, headers: { "content-type": "application/json" } },
      )
    })

    const client = createPosFaceScanClient({ baseUrl: "http://gw", fetchImpl: fetchMock as any })

    await expect(client.faceScan("sess_1", "data:image/jpeg;base64,aaa", "idem-2")).rejects.toMatchObject<Partial<PosApiError>>({
      name: "PosApiError",
      status: 504,
      code: "BIOMETRIC_TIMEOUT",
      requestId: "req-99",
    })
  })
})
