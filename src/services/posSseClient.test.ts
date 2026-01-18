import { describe, expect, it, vi } from "vitest"
import { createPosSseClient } from "./posSseClient"

class FakeEventSource {
  url: string
  onopen: ((ev: any) => void) | null = null
  onerror: ((ev: any) => void) | null = null
  onmessage: ((ev: any) => void) | null = null
  private listeners = new Map<string, Array<(ev: any) => void>>()
  closed = false

  constructor(url: string) {
    this.url = url
  }

  addEventListener(type: string, cb: (ev: any) => void) {
    const arr = this.listeners.get(type) ?? []
    arr.push(cb)
    this.listeners.set(type, arr)
  }

  emit(type: string, data: string) {
    const ev = { data }
    const arr = this.listeners.get(type) ?? []
    for (const cb of arr) cb(ev)
  }

  close() {
    this.closed = true
  }
}

async function flushAsync() {
  // Flush chained async awaits without running long timers (refresh).
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

describe("posSseClient", () => {
  it("connect initial calls createTicket once and opens one EventSource (no extra calls before refresh)", async () => {
    vi.useFakeTimers()
    let nowMs = 0

    const createTicket = vi.fn(async () => ({ ticket: "t1", expiresAtMs: nowMs + 10_000 }))
    const esInstances: FakeEventSource[] = []
    const eventSourceFactory = (url: string) => {
      const es = new FakeEventSource(url)
      esInstances.push(es)
      return es as unknown as EventSource
    }

    const fetchImpl = vi.fn(async () => new Response("", { status: 200 }))

    const client = createPosSseClient({
      baseUrl: "http://gw",
      createTicket,
      eventSourceFactory,
      fetchImpl: fetchImpl as any,
      now: () => nowMs,
      rand: () => 0.5,
    })

    client.subscribeTerminalEvents("tok", { onStatus: () => {} })
    await flushAsync()

    expect(createTicket).toHaveBeenCalledTimes(1)
    expect(esInstances.length).toBe(1)

    // before 80% TTL (8000ms): no refresh call yet
    nowMs += 7999
    await vi.advanceTimersByTimeAsync(7999)
    expect(createTicket).toHaveBeenCalledTimes(1)
    expect(esInstances.length).toBe(1)

    vi.useRealTimers()
  })

  it("proactive refresh at ~80% TTL swaps EventSource and reacquires ticket once", async () => {
    vi.useFakeTimers()
    let nowMs = 0

    const createTicket = vi
      .fn()
      .mockImplementationOnce(async () => ({ ticket: "t1", expiresAtMs: nowMs + 10_000 }))
      .mockImplementationOnce(async () => ({ ticket: "t2", expiresAtMs: nowMs + 10_000 }))

    const esInstances: FakeEventSource[] = []
    const eventSourceFactory = (url: string) => {
      const es = new FakeEventSource(url)
      esInstances.push(es)
      return es as unknown as EventSource
    }
    const fetchImpl = vi.fn(async () => new Response("", { status: 200 }))

    const client = createPosSseClient({
      baseUrl: "http://gw",
      createTicket,
      eventSourceFactory,
      fetchImpl: fetchImpl as any,
      now: () => nowMs,
      rand: () => 0.5,
    })

    const sub = client.subscribeTerminalEvents("tok", { onStatus: () => {} })
    await flushAsync()

    expect(createTicket).toHaveBeenCalledTimes(1)
    expect(sub.getTicket()).toBe("t1")
    expect(esInstances.length).toBe(1)
    expect(esInstances[0].closed).toBe(false)

    // hit refresh (~80% of 10s => 8s)
    nowMs += 8000
    await vi.advanceTimersByTimeAsync(8000)
    await flushAsync()

    expect(createTicket).toHaveBeenCalledTimes(2)
    expect(sub.getTicket()).toBe("t2")
    expect(esInstances.length).toBe(2)
    expect(esInstances[0].closed).toBe(true)

    sub.stop()
    vi.useRealTimers()
  })

  it("cleanup cancels refresh timer and does not open anything after stop()", async () => {
    vi.useFakeTimers()
    let nowMs = 0

    const createTicket = vi.fn(async () => ({ ticket: "t1", expiresAtMs: nowMs + 10_000 }))
    const esInstances: FakeEventSource[] = []
    const eventSourceFactory = (url: string) => {
      const es = new FakeEventSource(url)
      esInstances.push(es)
      return es as unknown as EventSource
    }
    const fetchImpl = vi.fn(async () => new Response("", { status: 200 }))

    const client = createPosSseClient({
      baseUrl: "http://gw",
      createTicket,
      eventSourceFactory,
      fetchImpl: fetchImpl as any,
      now: () => nowMs,
      rand: () => 0.5,
    })

    const sub = client.subscribeTerminalEvents("tok", { onStatus: () => {} })
    await flushAsync()

    expect(createTicket).toHaveBeenCalledTimes(1)
    sub.stop()

    // advance past refresh point; should not reacquire ticket or open new ES
    nowMs += 9000
    await vi.advanceTimersByTimeAsync(9000)
    await flushAsync()

    expect(createTicket).toHaveBeenCalledTimes(1)
    expect(esInstances.length).toBe(1)
    expect(esInstances[0].closed).toBe(true)

    vi.useRealTimers()
  })

  it("reconnect on onerror schedules backoff (not tight loop)", async () => {
    vi.useFakeTimers()
    let nowMs = 0

    const createTicket = vi.fn(async () => ({ ticket: "t1", expiresAtMs: nowMs + 10_000 }))
    const esInstances: FakeEventSource[] = []
    const eventSourceFactory = (url: string) => {
      const es = new FakeEventSource(url)
      esInstances.push(es)
      return es as unknown as EventSource
    }
    const fetchImpl = vi.fn(async () => new Response("", { status: 200 }))

    const onReconnect = vi.fn()
    const client = createPosSseClient({
      baseUrl: "http://gw",
      createTicket,
      eventSourceFactory,
      fetchImpl: fetchImpl as any,
      now: () => nowMs,
      rand: () => 0.0, // deterministic jitter
    })

    const sub = client.subscribeTerminalEvents("tok", { onStatus: () => {}, onReconnect })
    await flushAsync()
    expect(esInstances.length).toBe(1)

    ;(esInstances[0].onerror as any)?.({ type: "error" })
    await flushAsync()

    expect(onReconnect).toHaveBeenCalled()
    const call = onReconnect.mock.calls[0][0]
    expect(call.delayMs).toBeGreaterThan(0)

    sub.stop()
    vi.useRealTimers()
  })
})

