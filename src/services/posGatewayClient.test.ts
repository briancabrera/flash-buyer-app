import { describe, expect, it, vi } from "vitest"
import { createPosGatewayClient, PosApiError } from "./posGatewayClient"

describe("posGatewayClient", () => {
  it("sends only allowlisted headers and adds Idempotency-Key", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>
      // Echo headers back to validate from test.
      return new Response(JSON.stringify({ headers }), {
        status: 200,
        headers: { "content-type": "application/json", "x-request-id": "req_test" },
      })
    })

    const client = createPosGatewayClient({ baseUrl: "http://gw", fetchImpl: fetchMock as any })

    const res = await client.request<{ headers: Record<string, string> }>("POST", "/pos/sessions", {
      idempotencyKey: "idem_abc",
      body: { hello: "world" },
      headers: {
        authorization: "Bearer tok_123",
        "x-request-id": "req_client",
        "content-type": "application/json",
        "x-not-allowed": "nope",
      },
    })

    expect(res.requestId).toBe("req_test")
    expect(res.data.headers.authorization).toBe("Bearer tok_123")
    expect(res.data.headers["idempotency-key"]).toBe("idem_abc")
    expect(res.data.headers["x-request-id"]).toBe("req_client")
    expect(res.data.headers["x-not-allowed"]).toBeUndefined()
  })

  it("parses POS error payload and throws PosApiError with status/code/request_id", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "Unauthorized", request_id: "req-123" },
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      )
    })

    const client = createPosGatewayClient({ baseUrl: "http://gw", fetchImpl: fetchMock as any })

    await expect(client.request("GET", "/pos/rewards")).rejects.toMatchObject<Partial<PosApiError>>({
      name: "PosApiError",
      status: 401,
      code: "UNAUTHORIZED",
      requestId: "req-123",
    })
  })
})

