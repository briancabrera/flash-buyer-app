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
  IonTextarea,
  IonText,
} from "@ionic/react"
import styles from "./PosDebug.module.scss"
import { startTerminalSse, stopTerminalSse, useTerminalSse } from "../../hooks/useTerminalSse"
import { captureFrameFromVideo, normalizeImageBase64 } from "../../utils/captureFrame"
import { faceScan, setReward } from "../../services/posSessionsClient"
import { listRewardsWithMeta, type PosReward } from "../../services/posRewardsClient"
import { PosApiError } from "../../services/posGatewayClient"

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
  const sse = useTerminalSse()

  const [token, setToken] = useState<string>(import.meta.env.VITE_TERMINAL_TOKEN ?? "")
  const [imageInput, setImageInput] = useState<string>("")

  const [rewards, setRewards] = useState<PosReward[]>([])
  const [selectedRewardId, setSelectedRewardId] = useState<string>("")

  const [logs, setLogs] = useState<LogEntry[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)

  const sessionStatus = useMemo(() => getSessionStatus(sse.activeSession), [sse.activeSession])
  const sessionMode = useMemo(() => getSessionMode(sse.activeSession), [sse.activeSession])

  const pushLog = (entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, 100))
  }

  useEffect(() => {
    if (!sse.lastEvent) return
    pushLog({ ts: Date.now(), kind: "sse", message: `${sse.lastEvent.type}: ${sse.lastEvent.raw}` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sse.lastEvent?.raw])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      streamRef.current = stream
      const v = videoRef.current
      if (v) {
        v.srcObject = stream as any
        await v.play()
      }
      setCameraOn(true)
    } catch (e) {
      pushLog({ ts: Date.now(), kind: "error", message: `Camera error: ${String(e)}` })
      setCameraOn(false)
    }
  }

  const stopCamera = () => {
    const stream = streamRef.current
    if (stream) stream.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const v = videoRef.current
    if (v) v.srcObject = null as any
    setCameraOn(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    let imageBase64 = ""
    try {
      const v = videoRef.current
      if (cameraOn && v) {
        const captured = captureFrameFromVideo(v, { targetWidth: 640, maxBase64Length: 1_000_000 })
        imageBase64 = captured.imageBase64
        setImageInput(captured.dataUrl)
        if (captured.base64Length > 1_000_000) {
          pushLog({
            ts: Date.now(),
            kind: "error",
            message: `Captured base64 too large (${captured.base64Length}). Puede fallar (openapi maxLength=1,000,000).`,
          })
        }
      } else {
        imageBase64 = normalizeImageBase64(imageInput)
      }

      if (!imageBase64) {
        pushLog({ ts: Date.now(), kind: "error", message: "imageBase64 vacío (usá cámara o pegá base64/dataURL)." })
        return
      }

      pushLog({ ts: Date.now(), kind: "request", message: `POST /pos/sessions/${sse.activeSessionId}/face-scan` })
      const res = await faceScan(sse.activeSessionId, { imageBase64 }, token)
      pushLog({
        ts: Date.now(),
        kind: "response",
        message: `OK ${res.status} request_id=${res.requestId ?? "-"} body=${prettyJson(res.data)}`,
      })
    } catch (e) {
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

  const onLoadRewards = async () => {
    try {
      pushLog({ ts: Date.now(), kind: "request", message: "GET /pos/rewards" })
      const res = await listRewardsWithMeta(token)
      setRewards(res.items)
      pushLog({
        ts: Date.now(),
        kind: "response",
        message: `OK ${res.status} request_id=${res.requestId ?? "-"} items=${res.items.length}`,
      })
    } catch (e) {
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

  const onSelectReward = async () => {
    if (!sse.activeSessionId) {
      pushLog({ ts: Date.now(), kind: "error", message: "No currentSessionId yet (esperá eventos SSE)" })
      return
    }
    if (!selectedRewardId) {
      pushLog({ ts: Date.now(), kind: "error", message: "Seleccioná un reward primero." })
      return
    }
    try {
      pushLog({
        ts: Date.now(),
        kind: "request",
        message: `POST /pos/sessions/${sse.activeSessionId}/reward reward_id=${selectedRewardId}`,
      })
      const res = await setReward(sse.activeSessionId, { reward_id: selectedRewardId }, token)
      pushLog({
        ts: Date.now(),
        kind: "response",
        message: `OK ${res.status} request_id=${res.requestId ?? "-"} body=${prettyJson(res.data)}`,
      })
    } catch (e) {
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
              </IonText>
              <pre className={styles.mono}>{prettyJson(sse.activeSession)}</pre>
            </IonCardContent>
          </IonCard>

          {sessionStatus === "WAITING_FACE" && (
            <IonCard>
              <IonCardContent>
                <h2>WAITING_FACE</h2>

                <div className={styles.row}>
                  {!cameraOn ? (
                    <IonButton onClick={startCamera}>Start camera</IonButton>
                  ) : (
                    <IonButton color="medium" onClick={stopCamera}>
                      Stop camera
                    </IonButton>
                  )}
                  <IonButton onClick={onScanFaceNow}>Scan Face Now</IonButton>
                </div>

                {cameraOn && (
                  <div className={styles.videoWrap}>
                    <video ref={videoRef} className={styles.video} playsInline muted />
                  </div>
                )}

                <IonItem lines="none">
                  <IonLabel position="stacked">imageBase64 (pegá base64 o dataURL como fallback)</IonLabel>
                  <IonTextarea
                    value={imageInput}
                    onIonInput={(e) => setImageInput(String(e.detail.value ?? ""))}
                    autoGrow
                    rows={5}
                  />
                </IonItem>
              </IonCardContent>
            </IonCard>
          )}

          {sessionMode === "REDEEM" && (
            <IonCard>
              <IonCardContent>
                <h2>REDEEM</h2>
                <div className={styles.row}>
                  <IonButton onClick={onLoadRewards}>Load rewards</IonButton>
                  <IonButton onClick={onSelectReward} disabled={!selectedRewardId || !sse.activeSessionId}>
                    Select reward
                  </IonButton>
                </div>

                <IonList>
                  {rewards.map((r) => (
                    <IonItem
                      key={r.id}
                      button
                      onClick={() => setSelectedRewardId(r.id)}
                      color={selectedRewardId === r.id ? "light" : undefined}
                    >
                      <IonLabel>
                        <div>
                          <b>{r.name}</b>
                        </div>
                        <div>cost_points: {r.cost_points}</div>
                        <div className={styles.mono}>id: {r.id}</div>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
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

