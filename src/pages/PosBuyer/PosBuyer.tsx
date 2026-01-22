import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
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
import { AnimatePresence, motion } from "framer-motion"
import { gsap } from "gsap"
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

function SuccessCheck() {
  const r = 24
  const circ = 2 * Math.PI * r
  return (
    <div className={styles.checkWrap} aria-hidden="true">
      <motion.svg
        className={styles.checkmark}
        viewBox="0 0 52 52"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <circle className={styles.checkCircleBase} cx="26" cy="26" r={r} fill="none" />
        <motion.circle
          className={styles.checkCircle}
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
        <motion.path
          className={styles.check}
          fill="none"
          d="M14 27 l8 8 l16 -16"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.22 }}
        />
      </motion.svg>
    </div>
  )
}

function WaitLoader() {
  return <IonSpinner name="dots" />
}

function ThanksHeart() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const clipRef = useRef<SVGCircleElement | null>(null)
  const clipId = useId()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const c = clipRef.current
      const svg = svgRef.current
      const heart = svg?.querySelector("path")
      if (!c) return
      // Clip reveal: keep heart geometry static (no dash) and expand a circle from bottom vertex.
      if (svg) {
        gsap.set(svg, { opacity: 0, scale: 0.992, transformOrigin: "50% 50%" })
        gsap.to(svg, { opacity: 1, scale: 1, duration: 0.22, ease: "power2.out" })
      }
      if (heart) {
        gsap.set(heart, { opacity: 0 })
        gsap.to(heart, { opacity: 1, duration: 0.25, ease: "power2.out", delay: 0.05 })
      }
      gsap.fromTo(
        c,
        // Avoid exact 0 radius which can look "steppy" in some WebViews.
        { attr: { r: 0.001 } },
        { attr: { r: 32 }, duration: 1.25, ease: "power3.out" },
      )
    }, svgRef)

    return () => ctx.revert()
  }, [])

  // Single, closed "sharp" heart path (Feather-like). One piece => no gaps.
  const heartPath =
    "M12 21.23 L4.22 13.45 L3.16 12.39 A5.5 5.5 0 0 1 10.94 4.61 L12 5.67 L13.06 4.61 A5.5 5.5 0 0 1 20.84 12.39 L19.78 13.45 L12 21.23 Z"

  return (
    <div className={styles.thanksWrap} aria-hidden="true">
      <svg ref={svgRef} className={styles.thanksMark} viewBox="0 0 24 24">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <circle ref={clipRef} cx="12" cy="21.23" r="0" />
          </clipPath>
        </defs>
        <path d={heartPath} className={styles.thanksHeart} clipPath={`url(#${clipId})`} />
      </svg>
    </div>
  )
}

export default function PosBuyer() {
  const sse = useTerminalSse()
  const token = import.meta.env.VITE_TERMINAL_TOKEN ?? ""

  const [scanState, setScanState] = useState<ScanState>("idle")
  const [scanError, setScanError] = useState<string | null>(null)
  const [rewardStatus, setRewardStatus] = useState<RewardStatus>("idle")
  const [rewards, setRewards] = useState<PosReward[]>([])
  const [selectedRewardId, setSelectedRewardId] = useState<string>("")
  const [redeemStep, setRedeemStep] = useState<"verify" | "select" | "waiting">("verify")
  const redeemStepTimerRef = useRef<number | null>(null)

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
  const displayName = useMemo(() => {
    const first = (sessionUser?.first_name ?? "").trim()
    return first || null
  }, [sessionUser?.first_name])
  const lastKnownNameRef = useRef<string | null>(null)
  useEffect(() => {
    if (displayName) lastKnownNameRef.current = displayName
  }, [displayName])

  type UIMode = "thanks" | "active" | "idle"

  const [forcingThanks, setForcingThanks] = useState(false)
  const thanksTimerRef = useRef<number | null>(null)
  const prevSessionIdRef = useRef<string | null>(null)
  const prevSessionId = prevSessionIdRef.current
  const justEnded = !!prevSessionId && !activeSessionId

  // Keep prevSessionIdRef in sync without mutating during render.
  useLayoutEffect(() => {
    prevSessionIdRef.current = activeSessionId
  }, [activeSessionId])

  // Ensure "thanks" is shown immediately on the render where the session ends,
  // and then persisted via forcingThanks for the timer duration.
  useLayoutEffect(() => {
    if (justEnded) {
      setForcingThanks(true)
      if (thanksTimerRef.current) window.clearTimeout(thanksTimerRef.current)
      thanksTimerRef.current = window.setTimeout(() => {
        setForcingThanks(false)
        thanksTimerRef.current = null
      }, 2250)
      return
    }

    // If a new session arrives, cancel thanks immediately.
    if (activeSessionId) {
      if (thanksTimerRef.current) window.clearTimeout(thanksTimerRef.current)
      thanksTimerRef.current = null
      setForcingThanks(false)
    }
  }, [activeSessionId, justEnded])

  useEffect(() => {
    return () => {
      if (thanksTimerRef.current) window.clearTimeout(thanksTimerRef.current)
    }
  }, [])

  const uiMode: UIMode = useMemo(() => {
    if (forcingThanks || justEnded || buyerState === "done") return "thanks"
    if (activeSessionId) return "active"
    return "idle"
  }, [activeSessionId, buyerState, forcingThanks, justEnded])

  useEffect(() => {
    return () => {
      if (thanksTimerRef.current) window.clearTimeout(thanksTimerRef.current)
    }
  }, [])
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
      lastFaceScanRef.current = null
      stopCamera()
      setRedeemStep("verify")
      if (redeemStepTimerRef.current) window.clearTimeout(redeemStepTimerRef.current)
      redeemStepTimerRef.current = null
      return
    }
    setScanState("idle")
    setScanError(null)
    setRewardStatus("idle")
    setSelectedRewardId("")
    lastFaceScanRef.current = null
    stopCamera()
    setRedeemStep("verify")
    if (redeemStepTimerRef.current) window.clearTimeout(redeemStepTimerRef.current)
    redeemStepTimerRef.current = null
  }, [activeSessionId])

  useEffect(() => {
    // REDEEM: after FACE_VERIFIED, show success screen for 2s then allow selecting rewards.
    if (uiMode !== "active" || buyerState !== "face_verified_redeem") {
      if (redeemStepTimerRef.current) window.clearTimeout(redeemStepTimerRef.current)
      redeemStepTimerRef.current = null
      setRedeemStep("verify")
      return
    }

    setRedeemStep("verify")
    if (redeemStepTimerRef.current) window.clearTimeout(redeemStepTimerRef.current)
    redeemStepTimerRef.current = window.setTimeout(() => {
      setRedeemStep((prev) => (prev === "verify" ? "select" : prev))
      redeemStepTimerRef.current = null
    }, 2000)

    return () => {
      if (redeemStepTimerRef.current) window.clearTimeout(redeemStepTimerRef.current)
      redeemStepTimerRef.current = null
    }
  }, [buyerState, uiMode])

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
        const res = await listRewardsWithMeta(token, activeSessionId)
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
    setRedeemStep("waiting")
    setRewardStatus("sending")
    try {
      await redeemSelect(activeSessionId, { reward_id: rewardId }, token, request.idempotencyKey)
      setRewardStatus("awaiting_sse")
    } catch (e) {
      markRewardRequestStatus(rewardRequestBySessionRef.current, activeSessionId, "error")
      setRewardStatus("error")
      setRedeemStep("select")
    }
  }

  const showReconnect = sse.connectionStatus === "reconnecting" || sse.connectionStatus === "error"
  const scanCtaLabel = "Escanear"
  const isBusyScan = scanState === "scanning" || scanState === "sent"

  const motionProps = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25, ease: "easeOut" },
  } as const

  const contentStagger = {
    initial: {},
    animate: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  } as const

  const item = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: "easeIn" } },
  } as const

  return (
    <IonPage className={styles.page}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.title}>BioPOS 0.0.1</div>
            <div className={styles.bannerSlot}>
              <div className={`${styles.banner} ${showReconnect ? "" : styles.bannerHidden}`}>Reconectando…</div>
            </div>
          </div>

          {!token && <IonText color="danger">Falta VITE_TERMINAL_TOKEN</IonText>}

          <div className={styles.main}>
            <AnimatePresence mode="wait">
              {uiMode === "thanks" && (
                <motion.div
                  key="thanks-overlay"
                  className={`${styles.successStage} ${styles.center}`}
                  {...motionProps}
                  variants={contentStagger}
                >
                  <div>
                    <ThanksHeart />
                  </div>
                  <motion.div className={styles.successTitle} variants={item}>
                    {lastKnownNameRef.current
                      ? `${lastKnownNameRef.current}, gracias por tu compra`
                      : "Gracias por tu compra"}
                  </motion.div>
                  <motion.div className={styles.successText} variants={item}>
                    ¡Que disfrutes Flash!
                  </motion.div>
                </motion.div>
              )}

              {uiMode === "idle" && (
                <motion.div
                  key="idle"
                  className={`${styles.waitingStage} ${styles.center} ${styles.waitStage}`}
                  {...motionProps}
                  variants={contentStagger}
                >
                  <motion.div className={styles.waitingTitle} variants={item}>
                    Esperando al vendedor
                  </motion.div>
                  <motion.div className={styles.waitingText} variants={item}>
                    Por favor, aguardá al cajero.
                  </motion.div>
                  <motion.div className={styles.waitFooter} variants={item}>
                    <WaitLoader />
                  </motion.div>
                </motion.div>
              )}

              {uiMode === "active" && buyerState === "waiting_face" && (
                <motion.div key="waiting_face" className={styles.scanStage} {...motionProps} variants={contentStagger}>
                  <motion.div className={styles.scanHeader} variants={item}>
                    <div className={styles.scanTitle}>Mirá a la cámara</div>
                    <div className={styles.scanSubtitle}>Ubicá tu cara dentro del marco.</div>
                  </motion.div>

                  <motion.div
                    className={styles.cameraStagePremium}
                    variants={item}
                    animate={{
                      scale: scanState === "scanning" ? 0.995 : 1,
                      transition: { duration: 0.25, ease: "easeOut" },
                    }}
                  >
                    <FaceCaptureView videoRef={videoRef} overlayOpacity={1} isScanning={scanState === "scanning"} />
                  </motion.div>

                  <motion.div className={styles.sheetCard} variants={item}>
                    <div className={styles.sheetRow}>
                      <IonButton
                        className={`${styles.flashButton} ${
                          scanState === "scanning"
                            ? styles.flashButtonScanning
                            : scanState === "sent"
                              ? styles.flashButtonVerifying
                              : ""
                        }`}
                        onClick={onScan}
                        disabled={!canStartFaceScan(scanState)}
                        expand="block"
                      >
                        {isBusyScan ? <IonSpinner className={styles.ctaSpinner} name="dots" /> : scanCtaLabel}
                      </IonButton>
                    </div>

                    {scanError && (
                      <IonText color="danger">
                        <div className={styles.cardText}>{scanError}</div>
                      </IonText>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {uiMode === "active" && buyerState === "face_verified_purchase" && (
                <motion.div
                  key="verified_purchase"
                className={`${styles.successStage} ${styles.center} ${styles.waitStage}`}
                  {...motionProps}
                  variants={contentStagger}
                >
                <motion.div variants={item}>
                  <SuccessCheck />
                </motion.div>
                <motion.div className={styles.successTitle} variants={item}>
                  {lastKnownNameRef.current ? `¡Listo, ${lastKnownNameRef.current}!` : "¡Listo!"}
                </motion.div>
                <motion.div className={styles.successText} variants={item}>
                  Esperá al cajero para continuar.
                </motion.div>
                <motion.div className={styles.waitFooter} variants={item}>
                  <WaitLoader />
                </motion.div>
                </motion.div>
              )}

              {uiMode === "active" && buyerState === "face_verified_redeem" && redeemStep === "verify" && (
                <motion.div
                  key="redeem_verified"
                  className={`${styles.successStage} ${styles.center} ${styles.waitStage}`}
                  {...motionProps}
                  variants={contentStagger}
                >
                  <motion.div variants={item}>
                    <SuccessCheck />
                  </motion.div>
                  <motion.div className={styles.successTitle} variants={item}>
                    Identidad verificada
                  </motion.div>
                  <motion.div className={styles.successText} variants={item}>
                    Preparando recompensas.
                  </motion.div>
                  <motion.div className={styles.waitFooter} variants={item}>
                    <WaitLoader />
                  </motion.div>
                </motion.div>
              )}

              {uiMode === "active" && buyerState === "face_verified_redeem" && redeemStep === "select" && (
                <motion.div key="redeem_select" className={styles.catalogStage} {...motionProps} variants={contentStagger}>
                  <motion.div className={styles.catalogHeader} variants={item}>
                    <div className={styles.catalogGreeting}>
                      {`Hola${lastKnownNameRef.current ? ` ${lastKnownNameRef.current}` : ""}!`}
                    </div>
                    <div className={styles.catalogTitle}>Elegí tu recompensa</div>
                    <div className={styles.catalogSubtitle}>Seleccioná una opción para canjear.</div>
                  </motion.div>

                  {rewardStatus === "loading" && (
                    <div className={styles.skeletonList}>
                      <IonSkeletonText animated style={{ width: "100%", height: "56px" }} />
                      <IonSkeletonText animated style={{ width: "100%", height: "56px" }} />
                      <IonSkeletonText animated style={{ width: "100%", height: "56px" }} />
                    </div>
                  )}

                  {(rewardStatus === "sending" || rewardStatus === "awaiting_sse") && (
                    <motion.div
                      key="redeem_waiting_cashier_inline"
                      className={`${styles.successStage} ${styles.center} ${styles.waitStage}`}
                      variants={contentStagger}
                    >
                      <motion.div className={styles.successTitle} variants={item}>
                        Recompensa seleccionada
                      </motion.div>
                      <motion.div className={styles.successText} variants={item}>
                        Esperá al cajero para finalizar.
                      </motion.div>
                      <motion.div className={styles.waitFooter} variants={item}>
                        <WaitLoader />
                      </motion.div>
                    </motion.div>
                  )}

                  {rewardStatus === "ready" && rewards.length > 0 && (
                      <div className={styles.rewardGrid}>
                        {rewards.map((r) => {
                          const letter = (r.name?.trim()?.[0] ?? "?").toUpperCase()
                          const canRedeem = r.can_redeem !== false
                          const disabled = rewardStatus !== "ready" || !canRedeem
                          return (
                            <button
                              key={r.id}
                              type="button"
                              disabled={disabled}
                              className={`${styles.rewardTile} ${selectedRewardId === r.id ? styles.rewardTileSelected : ""} ${
                                disabled ? styles.rewardTileDisabled : ""
                              }`}
                              onClick={() => onSelectReward(r.id)}
                            >
                              <div className={styles.rewardTileTop}>
                                <div className={styles.rewardIcon} aria-hidden="true">
                                  <div className={styles.rewardIconText}>{letter}</div>
                                </div>
                                {!canRedeem ? (
                                  <div className={styles.rewardRedeemedPill}>Ya canjeado</div>
                                ) : (
                                  <div className={styles.rewardPointsPill}>{r.cost_points} pts</div>
                                )}
                              </div>
                              <div className={styles.rewardTileName}>{r.name}</div>
                              {r.description && <div className={styles.rewardTileDesc}>{String(r.description)}</div>}
                            </button>
                          )
                        })}
                      </div>
                    )}

                </motion.div>
              )}

              {uiMode === "active" && buyerState === "reward_selected" && (
                <motion.div
                  key="reward_selected"
                  className={`${styles.successStage} ${styles.center} ${styles.waitStage}`}
                  {...motionProps}
                  variants={contentStagger}
                >
                  <motion.div className={styles.successTitle} variants={item}>
                    Recompensa seleccionada
                  </motion.div>
                  <motion.div className={styles.successText} variants={item}>
                    Esperá al cajero para finalizar.
                  </motion.div>
                  <motion.div className={styles.waitFooter} variants={item}>
                    <WaitLoader />
                  </motion.div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
