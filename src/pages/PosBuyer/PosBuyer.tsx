import { useEffect, useMemo, useRef, useState } from "react"
import {
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSkeletonText,
  IonSpinner,
  IonText,
} from "@ionic/react"
import styles from "./PosBuyer.module.scss"
import { startTerminalSse, stopTerminalSse, useTerminalSse } from "../../hooks/useTerminalSse"
import { FaceCaptureView } from "../../components/FaceCaptureView/FaceCaptureView"
import { captureFrameFromVideo } from "../../utils/captureFrame"
import { faceScan } from "../../services/posFaceScanClient"
import { listRewardsWithMeta, type PosReward } from "../../services/posRewardsClient"
import { redeemSelect } from "../../services/posSessionsClient"
import { PosApiError } from "../../services/posGatewayClient"
import { derivePosBuyerState } from "../../utils/posBuyerState"
import { canStartFaceScan, getFaceScanAttempt, type FaceScanAttempt } from "../../utils/faceScanGuards"
import { getOrCreateRewardRequest, markRewardRequestStatus } from "../../utils/redeemGuards"

type ScanState = "idle" | "scanning" | "sent" | "error"
type RewardStatus = "idle" | "loading" | "ready" | "sending" | "awaiting_sse" | "done" | "error"

const FACE_CAPTURE_OPTIONS = { targetWidth: 720, jpegQuality: 0.7, maxBase64Length: 1_000_000 }

function errorToMessage(err: PosApiError | Error): string {
  if (err instanceof PosApiError) {
    switch (err.code) {
      case "VALIDATION_ERROR":
        return "La imagen no es válida. Acercate a la cámara e intentá de nuevo."
      case "FACE_VERIFICATION_FAILED":
        return "No pudimos verificar tu identidad. Intentá de nuevo."
      case "BIOMETRIC_UNAVAILABLE":
        return "Servicio biométrico no disponible. Probá en unos segundos."
      case "BIOMETRIC_TIMEOUT":
        return "Tiempo de espera agotado. Intentá nuevamente."
      case "INVALID_SESSION_STATUS":
        return "Sesión inválida para escaneo. Esperá al cajero."
      case "SESSION_NOT_FOUND":
        return "Sesión no encontrada. Esperá al cajero."
      default:
        return err.message
    }
  }
  return err.message
}

export default function PosBuyer() {
  const sse = useTerminalSse()
  const token = import.meta.env.VITE_TERMINAL_TOKEN ?? ""

  const [scanState, setScanState] = useState<ScanState>("idle")
  const [scanError, setScanError] = useState<string | null>(null)
  const [rewardStatus, setRewardStatus] = useState<RewardStatus>("idle")
  const [rewards, setRewards] = useState<PosReward[]>([])
  const [selectedRewardId, setSelectedRewardId] = useState<string>("")
  const [voucherCode, setVoucherCode] = useState<string>("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastFaceScanRef = useRef<FaceScanAttempt | null>(null)
  const rewardsBySessionRef = useRef<Map<string, PosReward[]>>(new Map())
  const rewardRequestBySessionRef = useRef<Map<string, { rewardId: string; idempotencyKey: string; status: "sending" | "done" | "error" }>>(
    new Map(),
  )

  const buyerState = useMemo(() => derivePosBuyerState(sse.activeSession), [sse.activeSession])
  const activeSessionId = sse.activeSessionId
  const sessionUser = useMemo(() => {
    if (!sse.activeSession || typeof sse.activeSession !== "object") return null
    return (sse.activeSession as any).user ?? null
  }, [sse.activeSession])
  const redeemSnapshot = useMemo(() => {
    if (!sse.activeSession || typeof sse.activeSession !== "object") return null
    return (sse.activeSession as any).redeem ?? null
  }, [sse.activeSession])

  useEffect(() => {
    if (!token) return
    startTerminalSse(token)
    return () => stopTerminalSse()
  }, [token])

  useEffect(() => {
    if (!activeSessionId) {
      setScanState("idle")
      setScanError(null)
      setRewardStatus("idle")
      setSelectedRewardId("")
      setVoucherCode("")
      lastFaceScanRef.current = null
      stopCamera()
      return
    }
    setScanState("idle")
    setScanError(null)
    setRewardStatus("idle")
    setSelectedRewardId("")
    setVoucherCode("")
    lastFaceScanRef.current = null
    stopCamera()
  }, [activeSessionId])

  useEffect(() => {
    if (buyerState === "waiting_face" || scanState === "scanning") {
      void startCamera()
      return
    }
    stopCamera()
  }, [buyerState, scanState])

  useEffect(() => {
    const voucher = redeemSnapshot?.voucher_code
    if (typeof voucher === "string" && voucher.length > 0) {
      setVoucherCode(voucher)
      setRewardStatus("done")
      if (activeSessionId) markRewardRequestStatus(rewardRequestBySessionRef.current, activeSessionId, "done")
    }
  }, [activeSessionId, redeemSnapshot?.voucher_code])

  useEffect(() => {
    if (!activeSessionId) return
    if (buyerState !== "face_verified_redeem") return
    if (rewardsBySessionRef.current.has(activeSessionId)) {
      setRewards(rewardsBySessionRef.current.get(activeSessionId) ?? [])
      setRewardStatus((prev) => (prev === "idle" ? "ready" : prev))
      return
    }
    const load = async () => {
      setRewardStatus("loading")
      try {
        const res = await listRewardsWithMeta(token)
        rewardsBySessionRef.current.set(activeSessionId, res.items)
        setRewards(res.items)
        setRewardStatus("ready")
      } catch (e) {
        setRewardStatus("error")
      }
    }
    void load()
  }, [activeSessionId, buyerState, token])

  const startCamera = async () => {
    if (streamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      streamRef.current = stream
      const v = videoRef.current
      if (v) {
        v.srcObject = stream as any
        await v.play()
      }
    } catch (e) {
      setScanError("No se pudo acceder a la cámara.")
    }
  }

  const stopCamera = () => {
    const stream = streamRef.current
    if (stream) stream.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const v = videoRef.current
    if (v) v.srcObject = null as any
  }

  const onScan = async () => {
    if (!canStartFaceScan(scanState)) return
    if (!activeSessionId || buyerState !== "waiting_face") return
    const v = videoRef.current
    if (!v) return
    try {
      setScanError(null)
      setScanState("scanning")
      const captured = captureFrameFromVideo(v, FACE_CAPTURE_OPTIONS)
      const attempt = getFaceScanAttempt({
        last: lastFaceScanRef.current,
        payload: captured.dataUrl,
        createKey: () => globalThis.crypto?.randomUUID?.() ?? `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      })
      lastFaceScanRef.current = attempt
      await faceScan(activeSessionId, token, captured.dataUrl, attempt.idempotencyKey)
      setScanState("sent")
    } catch (e) {
      setScanState("error")
      setScanError(errorToMessage(e as Error))
    }
  }

  const onSelectReward = async (rewardId: string) => {
    if (!activeSessionId) return
    if (rewardStatus === "sending" || rewardStatus === "awaiting_sse" || rewardStatus === "done") return
    const { request, shouldSend } = getOrCreateRewardRequest({
      map: rewardRequestBySessionRef.current,
      sessionId: activeSessionId,
      rewardId,
      createKey: () => globalThis.crypto?.randomUUID?.() ?? `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    })
    if (!shouldSend) return
    setSelectedRewardId(rewardId)
    setRewardStatus("sending")
    try {
      await redeemSelect(activeSessionId, { reward_id: rewardId }, token, request.idempotencyKey)
      setRewardStatus("awaiting_sse")
    } catch (e) {
      markRewardRequestStatus(rewardRequestBySessionRef.current, activeSessionId, "error")
      setRewardStatus("error")
    }
  }

  const showReconnect = sse.connectionStatus === "reconnecting" || sse.connectionStatus === "error"

  return (
    <IonPage className={styles.page}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.title}>POS Buyer</div>
            {showReconnect && <div className={styles.banner}>Reconectando…</div>}
          </div>

          {sessionUser && (
            <div className={styles.userBadge}>
              {sessionUser.first_name ?? ""} {sessionUser.last_name ?? ""}
            </div>
          )}

          {!token && <IonText color="danger">Falta VITE_TERMINAL_TOKEN</IonText>}

          {buyerState === "idle" && (
            <div className={styles.panel}>
              <div className={styles.bigMessage}>Esperando al vendedor…</div>
            </div>
          )}

          {buyerState === "waiting_face" && (
            <div className={styles.panel}>
              <div className={styles.bigMessage}>Mirá a la cámara</div>
              <div className={styles.cameraStage}>
                <FaceCaptureView videoRef={videoRef} overlayOpacity={1} showScanBand={scanState === "scanning"} />
                <div className={styles.cameraControls}>
                  <IonButton onClick={onScan} disabled={!canStartFaceScan(scanState)}>
                    {scanState === "scanning" ? "Escaneando…" : "Escanear"}
                  </IonButton>
                </div>
              </div>
              {scanState === "sent" && <IonText>Verificando identidad…</IonText>}
              {scanError && <IonText color="danger">{scanError}</IonText>}
            </div>
          )}

          {buyerState === "face_verified_purchase" && (
            <div className={styles.panel}>
              <div className={styles.bigMessage}>Identidad verificada</div>
              <div>Esperá al cajero…</div>
            </div>
          )}

          {buyerState === "face_verified_redeem" && (
            <div className={styles.panel}>
              <div className={styles.bigMessage}>Elegí tu recompensa</div>
              {rewardStatus === "loading" && (
                <div className={styles.skeletonList}>
                  <IonSkeletonText animated style={{ width: "100%", height: "48px" }} />
                  <IonSkeletonText animated style={{ width: "100%", height: "48px" }} />
                  <IonSkeletonText animated style={{ width: "100%", height: "48px" }} />
                </div>
              )}
              {rewardStatus === "ready" && (
                <IonList className={styles.rewardList}>
                  {rewards.map((r) => (
                    <IonItem
                      key={r.id}
                      button
                      disabled={rewardStatus === "sending" || rewardStatus === "awaiting_sse" || rewardStatus === "done"}
                      onClick={() => onSelectReward(r.id)}
                      color={selectedRewardId === r.id ? "light" : undefined}
                    >
                      <IonLabel>
                        <div className={styles.rewardName}>{r.name}</div>
                        {r.description && <div className={styles.rewardDesc}>{String(r.description)}</div>}
                        <div className={styles.rewardPoints}>Puntos: {r.cost_points}</div>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              )}
              {rewardStatus === "sending" && (
                <div className={styles.inlineStatus}>
                  <IonSpinner name="dots" />
                  <span>Enviando selección…</span>
                </div>
              )}
              {rewardStatus === "awaiting_sse" && <div>Reward seleccionada, espere al cajero…</div>}
            </div>
          )}

          {buyerState === "reward_selected" && (
            <div className={styles.panel}>
              <div className={styles.bigMessage}>Reward seleccionada</div>
              <div>Esperá al cajero…</div>
              {voucherCode && (
                <div className={styles.voucherBox}>
                  <div className={styles.voucherTitle}>Tu código</div>
                  <div className={styles.voucherCode}>{voucherCode}</div>
                </div>
              )}
            </div>
          )}

          {buyerState === "done" && (
            <div className={styles.panel}>
              <div className={styles.bigMessage}>Sesión finalizada</div>
              <div>Gracias.</div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
