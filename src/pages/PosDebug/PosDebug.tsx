import { useEffect, useMemo, useRef, useState } from "react"
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  useIonRouter,
} from "@ionic/react"
import styles from "./PosDebug.module.scss"
import { startTerminalSse, stopTerminalSse, useTerminalSse } from "../../hooks/useTerminalSse"
import { faceScan } from "../../services/posFaceScanClient"
import { redeemSelect } from "../../services/posSessionsClient"
import { listRewardsWithMeta, type PosReward } from "../../services/posRewardsClient"
import { PosApiError } from "../../services/posGatewayClient"
import { setFaceCaptureCallbacks } from "../../utils/faceCaptureBridge"
import { shouldAutoScan } from "../../utils/posAutoScanGuard"
import { getOrCreateRewardRequest, markRewardRequestStatus } from "../../utils/redeemGuards"

type LogEntry =
  | { ts: number; kind: "sse"; message: string }
  | { ts: number; kind: "request"; message: string }
  | { ts: number; kind: "response"; message: string }
  | { ts: number; kind: "error"; message: string }

function prettyJson(x: unknown) {
  try {
    return JSON.stringify(x, null, 2)
  } catch {
    return String(x)
  }
}

function getSessionStatus(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null
  return (snapshot as any).status ?? null
}

function getSessionMode(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null
  return (snapshot as any).mode ?? null
}

export default function PosDebug() {
  const router = useIonRouter()
  const sse = useTerminalSse()

  const [token, setToken] = useState<string>(import.meta.env.VITE_TERMINAL_TOKEN ?? "")
  const [scanState, setScanState] = useState<"idle" | "scanning" | "sending" | "awaiting_sse" | "verified" | "error">(
    "idle",
  )
  const [scanError, setScanError] = useState<{ code?: string; message: string; requestId?: string } | null>(null)
  const [lastImageBase64Length, setLastImageBase64Length] = useState<number | null>(null)

  const [rewards, setRewards] = useState<PosReward[]>([])
  const [selectedRewardId, setSelectedRewardId] = useState<string>("")
  const [rewardStatus, setRewardStatus] = useState<"idle" | "loading" | "ready" | "sending" | "awaiting_sse" | "done" | "error">(
    "idle",
  )
  const [voucherCode, setVoucherCode] = useState<string>("")

  const [logs, setLogs] = useState<LogEntry[]>([])

  const lastAutoScanSessionIdRef = useRef<string | null>(null)
  const pendingScanSessionIdRef = useRef<string | null>(null)
  const lastPayloadRef = useRef<{ payload: string; idempotencyKey: string } | null>(null)
  const rewardsBySessionRef = useRef<Map<string, PosReward[]>>(new Map())
  const rewardRequestBySessionRef = useRef<Map<string, { rewardId: string; idempotencyKey: string; status: "sending" | "done" | "error" }>>(
    new Map(),
  )

  const sessionStatus = useMemo(() => getSessionStatus(sse.activeSession), [sse.activeSession])
  const sessionMode = useMemo(() => getSessionMode(sse.activeSession), [sse.activeSession])
  const sessionUser = useMemo(() => {
    if (!sse.activeSession || typeof sse.activeSession !== "object") return null
    return (sse.activeSession as any).user ?? null
  }, [sse.activeSession])
  const sessionRedeem = useMemo(() => {
    if (!sse.activeSession || typeof sse.activeSession !== "object") return null
    return (sse.activeSession as any).redeem ?? null
  }, [sse.activeSession])

  const pushLog = (entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, 100))
  }

  useEffect(() => {
    if (!sse.lastEvent) return
    pushLog({ ts: Date.now(), kind: "sse", message: `${sse.lastEvent.type}: ${sse.lastEvent.raw}` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sse.lastEvent?.raw])

  const openCaptureOverlay = () => {
    if (!sse.activeSessionId) return
    if (scanState === "scanning" || scanState === "sending" || scanState === "awaiting_sse") return
    setScanState("scanning")
    setScanError(null)
    setFaceCaptureCallbacks({
      onCapture: async (payload) => {
        if (!sse.activeSessionId) return
        const currentSessionId = sse.activeSessionId
        pendingScanSessionIdRef.current = currentSessionId
        setScanState("sending")
        setLastImageBase64Length(payload.base64Length)
        pushLog({
          ts: Date.now(),
          kind: "request",
          message: `Captured image base64 length=${payload.base64Length} (w=${payload.width} h=${payload.height})`,
        })

        const last = lastPayloadRef.current
        const idempotencyKey =
          last && last.payload === payload.dataUrl
            ? last.idempotencyKey
            : globalThis.crypto?.randomUUID?.() ?? `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`
        lastPayloadRef.current = { payload: payload.dataUrl, idempotencyKey }

        try {
          pushLog({
            ts: Date.now(),
            kind: "request",
            message: `POST /pos/sessions/${currentSessionId}/face-scan idem=${idempotencyKey}`,
          })
          const res = await faceScan(currentSessionId, token, payload.dataUrl, idempotencyKey)
          pushLog({
            ts: Date.now(),
            kind: "response",
            message: `OK ${res.status} request_id=${res.requestId ?? "-"} body=${prettyJson(res.data)}`,
          })
          setScanState("awaiting_sse")
        } catch (e) {
          if (e instanceof PosApiError) {
            setScanError({ code: e.code, message: e.message, requestId: e.requestId })
            pushLog({
              ts: Date.now(),
              kind: "error",
              message: `ERR ${e.status} code=${e.code ?? "-"} request_id=${e.requestId ?? "-"} msg=${e.message}`,
            })
          } else {
            setScanError({ message: String(e) })
            pushLog({ ts: Date.now(), kind: "error", message: String(e) })
          }
          setScanState("error")
        }
      },
      onCancel: () => {
        setScanState("idle")
      },
    })
    router.push("/facial-recognition?capture=1&auto=1", "forward")
  }

  const onStartListening = () => {
    pushLog({ ts: Date.now(), kind: "request", message: "Start Listening (terminal SSE)" })
    startTerminalSse(token)
  }

  const onStopListening = () => {
    pushLog({ ts: Date.now(), kind: "request", message: "Stop Listening (terminal SSE)" })
    stopTerminalSse()
  }

  const onScanFaceNow = async () => {
    if (!sse.activeSessionId) {
      pushLog({ ts: Date.now(), kind: "error", message: "No currentSessionId yet (esperá eventos SSE)" })
      return
    }
    openCaptureOverlay()
  }

  useEffect(() => {
    const status = sessionStatus
    if (!sse.activeSessionId || !status) return
    if (pendingScanSessionIdRef.current === sse.activeSessionId && status === "FACE_VERIFIED") {
      setScanState("verified")
      pushLog({ ts: Date.now(), kind: "sse", message: "FACE_VERIFIED (SSE update)" })
    }
  }, [sse.activeSessionId, sessionStatus])

  useEffect(() => {
    if (!sse.activeSessionId) return
    const voucher = sessionRedeem?.voucher_code
    if (typeof voucher === "string" && voucher.length > 0) {
      setVoucherCode(voucher)
      setRewardStatus("done")
      markRewardRequestStatus(rewardRequestBySessionRef.current, sse.activeSessionId, "done")
    }
  }, [sse.activeSessionId, sessionRedeem?.voucher_code])

  useEffect(() => {
    const id = sse.activeSessionId
    if (!id) {
      setSelectedRewardId("")
      setVoucherCode("")
      setRewardStatus("idle")
      return
    }
    setSelectedRewardId("")
    setVoucherCode("")
    setRewardStatus("idle")
  }, [sse.activeSessionId])

  useEffect(() => {
    const should = shouldAutoScan({
      activeSessionId: sse.activeSessionId,
      activeSessionStatus: sessionStatus,
      lastAutoScanSessionId: lastAutoScanSessionIdRef.current,
    })
    if (!should) return
    lastAutoScanSessionIdRef.current = sse.activeSessionId
    openCaptureOverlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sse.activeSessionId, sessionStatus])

  useEffect(() => {
    if (!sse.activeSessionId) return
    if (sessionMode !== "REDEEM" || sessionStatus !== "FACE_VERIFIED") return
    if (rewardsBySessionRef.current.has(sse.activeSessionId)) {
      setRewards(rewardsBySessionRef.current.get(sse.activeSessionId) ?? [])
      setRewardStatus((prev) => (prev === "idle" ? "ready" : prev))
      return
    }
    const load = async () => {
      setRewardStatus("loading")
      try {
        pushLog({ ts: Date.now(), kind: "request", message: "GET /pos/rewards" })
        const res = await listRewardsWithMeta(token)
        rewardsBySessionRef.current.set(sse.activeSessionId as string, res.items)
        setRewards(res.items)
        setRewardStatus("ready")
        pushLog({
          ts: Date.now(),
          kind: "response",
          message: `OK ${res.status} request_id=${res.requestId ?? "-"} items=${res.items.length}`,
        })
      } catch (e) {
        setRewardStatus("error")
        if (e instanceof PosApiError) {
          pushLog({
            ts: Date.now(),
            kind: "error",
            message: `ERR ${e.status} code=${e.code ?? "-"} request_id=${e.requestId ?? "-"} msg=${e.message}`,
          })
        } else {
          pushLog({ ts: Date.now(), kind: "error", message: String(e) })
        }
      }
    }
    void load()
  }, [sse.activeSessionId, sessionMode, sessionStatus, token])

  const onSelectReward = async () => {
    if (!sse.activeSessionId) {
      pushLog({ ts: Date.now(), kind: "error", message: "No currentSessionId yet (esperá eventos SSE)" })
      return
    }
    if (rewardStatus === "sending" || rewardStatus === "awaiting_sse") {
      return
    }
    if (!selectedRewardId) {
      pushLog({ ts: Date.now(), kind: "error", message: "Seleccioná un reward primero." })
      return
    }
    if (rewardStatus === "done" || voucherCode) {
      pushLog({ ts: Date.now(), kind: "error", message: "Voucher ya generado para esta sesión." })
      return
    }
    try {
      const { request, shouldSend } = getOrCreateRewardRequest({
        map: rewardRequestBySessionRef.current,
        sessionId: sse.activeSessionId,
        rewardId: selectedRewardId,
        createKey: () => globalThis.crypto?.randomUUID?.() ?? `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      })

      if (!shouldSend) {
        pushLog({ ts: Date.now(), kind: "error", message: "Reward ya seleccionado para esta sesión." })
        return
      }

      pushLog({
        ts: Date.now(),
        kind: "request",
        message: `POST /pos/sessions/${sse.activeSessionId}/reward reward_id=${selectedRewardId} idem=${request.idempotencyKey}`,
      })
      setRewardStatus("sending")
      const res = await redeemSelect(sse.activeSessionId, { reward_id: selectedRewardId }, token, request.idempotencyKey)
      pushLog({
        ts: Date.now(),
        kind: "response",
        message: `OK ${res.status} request_id=${res.requestId ?? "-"} body=${prettyJson(res.data)}`,
      })
      setRewardStatus("awaiting_sse")
    } catch (e) {
      if (sse.activeSessionId) markRewardRequestStatus(rewardRequestBySessionRef.current, sse.activeSessionId, "error")
      setRewardStatus("error")
      if (e instanceof PosApiError) {
        pushLog({
          ts: Date.now(),
          kind: "error",
          message: `ERR ${e.status} code=${e.code ?? "-"} request_id=${e.requestId ?? "-"} msg=${e.message}`,
        })
      } else {
        pushLog({ ts: Date.now(), kind: "error", message: String(e) })
      }
    }
  }

  return (
    <IonPage className={styles.page}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <h1>POS Debug</h1>

          <IonCard>
            <IonCardContent>
              <div className={styles.row}>
                <IonItem lines="none">
                  <IonLabel position="stacked">Terminal token (Bearer)</IonLabel>
                  <IonInput value={token} onIonInput={(e) => setToken(String(e.detail.value ?? ""))} />
                </IonItem>
              </div>

              <div className={styles.row}>
                <IonButton onClick={onStartListening}>Start Listening</IonButton>
                <IonButton color="medium" onClick={onStopListening}>
                  Stop
                </IonButton>
                <span className={styles.pill}>status: {sse.connectionStatus}</span>
                <span className={styles.pill}>lastEvent: {sse.lastEvent?.type ?? "-"}</span>
                <span className={styles.pill}>ticket: {sse.ticket ?? "-"}</span>
                <span className={styles.pill}>activeSession: {sse.activeSessionId ?? "-"}</span>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardContent>
              <IonText>
                <div>
                  Session: <b>{sse.activeSessionId ?? "-"}</b> · status: <b>{sessionStatus ?? "-"}</b> · mode:{" "}
                  <b>{sessionMode ?? "-"}</b>
                </div>
                {sessionUser && (
                  <div>
                    User:{" "}
                    <b>
                      {sessionUser.first_name ?? ""} {sessionUser.last_name ?? ""}
                    </b>
                  </div>
                )}
              </IonText>
              <pre className={styles.mono}>{prettyJson(sse.activeSession)}</pre>
            </IonCardContent>
          </IonCard>

          {sessionStatus === "WAITING_FACE" && (
            <IonCard>
              <IonCardContent>
                <h2>WAITING_FACE</h2>

                <div className={styles.row}>
                  <IonButton onClick={onScanFaceNow}>Scan Face Now</IonButton>
                </div>

                <div className={styles.row}>
                  <span className={styles.pill}>scan: {scanState}</span>
                  {lastImageBase64Length !== null && (
                    <span className={styles.pill}>base64Length: {lastImageBase64Length}</span>
                  )}
                </div>

                {scanError && (
                  <IonText color="danger">
                    <div className={styles.mono}>
                      err code={scanError.code ?? "-"} request_id={scanError.requestId ?? "-"} msg={scanError.message}
                    </div>
                    {scanError.code === "BIOMETRIC_UNAVAILABLE" && <div>Biometric service unavailable.</div>}
                    {scanError.code === "BIOMETRIC_TIMEOUT" && <div>Biometric service timeout. Try again.</div>}
                    {scanError.code === "VALIDATION_ERROR" && lastImageBase64Length !== null && (
                      <div>
                        imageBase64 length={lastImageBase64Length} (ajustá quality/width si excede 1,000,000)
                      </div>
                    )}
                  </IonText>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {sessionMode === "REDEEM" && sessionStatus === "FACE_VERIFIED" && (
            <IonCard>
              <IonCardContent>
                <h2>Select Reward</h2>
                <div className={styles.row}>
                  <span className={styles.pill}>rewards: {rewardStatus}</span>
                  <IonButton onClick={onSelectReward} disabled={!selectedRewardId || rewardStatus === "sending" || rewardStatus === "awaiting_sse"}>
                    Select reward
                  </IonButton>
                </div>

                <IonList>
                  {rewards.map((r) => (
                    <IonItem
                      key={r.id}
                      button={rewardStatus !== "sending" && rewardStatus !== "awaiting_sse" && rewardStatus !== "done"}
                      disabled={rewardStatus === "sending" || rewardStatus === "awaiting_sse" || rewardStatus === "done"}
                      onClick={() => {
                        if (rewardStatus === "sending" || rewardStatus === "awaiting_sse" || rewardStatus === "done") return
                        setSelectedRewardId(r.id)
                      }}
                      color={selectedRewardId === r.id ? "light" : undefined}
                    >
                      <IonLabel>
                        <div>
                          <b>{r.name}</b>
                        </div>
                        {r.description && <div>{String(r.description).slice(0, 80)}</div>}
                        <div>cost_points: {r.cost_points}</div>
                        <div className={styles.mono}>id: {r.id}</div>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>

                {rewardStatus === "awaiting_sse" && <IonText>Listo, confirmá en caja…</IonText>}
                {voucherCode && (
                  <div className={styles.voucherBox}>
                    <div className={styles.voucherTitle}>VOUCHER CODE</div>
                    <div className={styles.voucherCode}>{voucherCode}</div>
                    <IonButton onClick={() => router.push("/home", "back")}>Done</IonButton>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {sessionMode === "PURCHASE" && sessionStatus === "FACE_VERIFIED" && (
            <IonCard>
              <IonCardContent>
                <h2>Verificado</h2>
                <div className={styles.row}>
                  <IonButton onClick={() => router.push("/home", "back")}>Done</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          <IonCard>
            <IonCardContent>
              <h2>Logs</h2>
              {logs.length === 0 ? (
                <IonText color="medium">No logs yet.</IonText>
              ) : (
                <div>
                  {logs.map((l, idx) => (
                    <div key={idx} className={styles.logItem}>
                      <span className={styles.pill}>{l.kind}</span> <span className={styles.pill}>{new Date(l.ts).toISOString()}</span>
                      <div className={styles.mono}>{l.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  )
}

