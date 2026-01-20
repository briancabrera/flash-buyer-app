import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

let capturedHandlers: any = null

vi.mock("../services/posSseClient", () => {
  return {
    posSseClient: {
      subscribeTerminalEvents: vi.fn((_token: string, handlers: any) => {
        capturedHandlers = handlers
        return { getTicket: () => "t1", stop: vi.fn() }
      }),
    },
  }
})

import { startTerminalSse, stopTerminalSse, useTerminalSse } from "./useTerminalSse"
import { posSseClient } from "../services/posSseClient"

function Probe() {
  const s = useTerminalSse()
  return (
    <div>
      <div data-testid="activeSessionId">{s.activeSessionId ?? ""}</div>
      <div data-testid="activeStatus">{(s.activeSession as any)?.status ?? ""}</div>
      <div data-testid="lastEventType">{s.lastEvent?.type ?? ""}</div>
    </div>
  )
}

function emitEvent(type: string, data: any) {
  act(() => {
    capturedHandlers.onEvent?.({ type, data, raw: JSON.stringify(data) })
  })
}

describe("useTerminalSse (event-driven)", () => {
  beforeEach(() => {
    capturedHandlers = null
    act(() => {
      stopTerminalSse()
    })
  })

  afterEach(() => {
    capturedHandlers = null
    act(() => {
      stopTerminalSse()
    })
  })

  it("opens only one SSE connection per token", () => {
    render(
      <>
        <Probe />
        <Probe />
      </>,
    )

    act(() => {
      startTerminalSse("tok")
      startTerminalSse("tok")
    })

    expect((posSseClient.subscribeTerminalEvents as any).mock.calls.length).toBe(1)

    act(() => {
      stopTerminalSse()
      startTerminalSse("tok")
    })
    expect((posSseClient.subscribeTerminalEvents as any).mock.calls.length).toBe(2)

    act(() => {
      stopTerminalSse()
    })
  })

  it("terminal_state does not change activeSession; current_session does", () => {
    render(<Probe />)
    act(() => {
      startTerminalSse("tok")
    })

    expect(screen.getByTestId("activeSessionId").textContent).toBe("")
    expect(capturedHandlers).not.toBeNull()

    emitEvent("terminal_state", { merchant_id: "m1", terminal_id: "t1", status: "ONLINE" })
    expect(screen.getByTestId("lastEventType").textContent).toBe("terminal_state")
    expect(screen.getByTestId("activeSessionId").textContent).toBe("")

    emitEvent("current_session", { session: { session_id: "s1", status: "WAITING_FACE" } })
    expect(screen.getByTestId("lastEventType").textContent).toBe("current_session")
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")
    expect(screen.getByTestId("activeStatus").textContent).toBe("WAITING_FACE")
  })

  it("current_session can clear activeSession with session=null", () => {
    render(<Probe />)
    act(() => startTerminalSse("tok"))

    emitEvent("current_session", { session: { session_id: "s1", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")

    emitEvent("current_session", { session: null })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("")
  })

  it("session_created replaces activeSession when a new session is created (session switch)", () => {
    render(<Probe />)
    act(() => startTerminalSse("tok"))

    emitEvent("current_session", { session: { session_id: "s1", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")

    emitEvent("session_created", { session: { session_id: "s2", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s2")
  })

  it("session_updated updates the active snapshot", () => {
    render(<Probe />)
    act(() => startTerminalSse("tok"))

    emitEvent("current_session", { session: { session_id: "s1", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeStatus").textContent).toBe("WAITING_FACE")

    emitEvent("session_updated", { session: { session_id: "s1", status: "FACE_VERIFIED" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")
    expect(screen.getByTestId("activeStatus").textContent).toBe("FACE_VERIFIED")
  })

  it("session_updated does NOT overwrite activeSession if it targets another session (late event)", () => {
    render(<Probe />)
    act(() => startTerminalSse("tok"))

    emitEvent("current_session", { session: { session_id: "s1", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")

    emitEvent("session_updated", { session: { session_id: "s2", status: "FACE_VERIFIED" } })
    // should stay on s1
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")
    expect(screen.getByTestId("activeStatus").textContent).toBe("WAITING_FACE")
  })

  it("session_closed clears activeSession only when session_id matches (and ignores others)", () => {
    render(<Probe />)
    act(() => startTerminalSse("tok"))

    emitEvent("current_session", { session: { session_id: "s1", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")

    emitEvent("session_closed", { session_id: "s2" })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")

    emitEvent("session_closed", { session_id: "s1" })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("")
  })

  it("reconnection: after reconnect status, current_session can bootstrap activeSession again", () => {
    render(<Probe />)
    act(() => startTerminalSse("tok"))

    emitEvent("current_session", { session: { session_id: "s1", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s1")

    act(() => {
      capturedHandlers.onStatus?.("reconnecting")
      capturedHandlers.onStatus?.("connected")
    })

    emitEvent("current_session", { session: { session_id: "s2", status: "WAITING_FACE" } })
    expect(screen.getByTestId("activeSessionId").textContent).toBe("s2")
  })
})

