"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import {
  IonContent,
  IonPage,
  useIonViewWillLeave,
  useIonViewDidLeave
} from "@ionic/react"
import { useIonRouter } from "@ionic/react"
import { motion } from "framer-motion"
import styles from "./FacialRecognition.module.scss"

type Phase = "boot" | "scanning" | "success"

const FacialRecognition: React.FC = () => {
  const router = useIonRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<Phase>("boot")
  const [isCameraReady, setIsCameraReady] = useState(false)

  // ——— Apagado duro de cámara
  const stopCamera = () => {
    try {
      const stream = streamRef.current
      if (stream) {
        stream.getTracks().forEach(t => { try { t.stop() } catch {} })
      }
      streamRef.current = null
      const v = videoRef.current
      if (v) {
        try { v.pause() } catch {}
        v.srcObject = null
        try { v.removeAttribute("src") } catch {}
        try { v.load?.() } catch {}
      }
    } catch (e) {
      console.warn("stopCamera error:", e)
    }
  }

  useIonViewWillLeave(stopCamera)
  useIonViewDidLeave(stopCamera)

  useEffect(() => {
    let toSuccess: number | undefined
    let toRoute: number | undefined

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        })
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          const onCanPlay = () => {
            setIsCameraReady(true)
            setPhase("scanning")
            v.removeEventListener("canplay", onCanPlay)

            // DEMO: 3s de escaneo → éxito
            toSuccess = window.setTimeout(() => {
              setPhase("success") // ⬅️ mostramos el tick sobre la cámara
              // NO apagamos la cámara aún; la apagamos al navegar
              toRoute = window.setTimeout(() => {
                stopCamera()
                router.push("/select-payment-method", "root", "replace")
              }, 1200)
            }, 3000)
          }
          v.addEventListener("canplay", onCanPlay, { once: true })
          v.play?.().catch(() => {})
        }
      } catch (err) {
        console.error("Camera error:", err)
        // Si falla la cámara: seguimos el flujo demo
        setIsCameraReady(false)
        setPhase("scanning")
        toSuccess = window.setTimeout(() => {
          setPhase("success")
          toRoute = window.setTimeout(() => {
            router.push("/select-payment-method", "root", "replace")
          }, 1200)
        }, 3000)
      }
    }

    start()

    const onVisibility = () => { if (document.hidden) stopCamera() }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      if (toSuccess) window.clearTimeout(toSuccess)
      if (toRoute) window.clearTimeout(toRoute)
      document.removeEventListener("visibilitychange", onVisibility)
      stopCamera()
    }
  }, [router])

  // Overlay: 0 (antes de cámara), 1 (scanning), 0 (success → fade-out)
  const overlayOpacity = !isCameraReady ? 0 : phase === "success" ? 0 : 1

  return (
    <IonPage className={styles.facialRecognitionPage}>
      <IonContent fullscreen>
        <div className={styles.container}>
          {/* Cámara: NO se oculta al success (tick aparece encima) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.cameraFeed}
          />

          {/* Overlay minimal: solo el rectángulo + línea de escaneo */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: overlayOpacity }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className={styles.frame}>
              <div className={`${styles.corner} ${styles.tl}`} />
              <div className={`${styles.corner} ${styles.tr}`} />
              <div className={`${styles.corner} ${styles.bl}`} />
              <div className={`${styles.corner} ${styles.br}`} />

              {/* scan line (solo en scanning) */}
              {phase === "scanning" && <div className={styles.scanBand} />}

            </div>
          </motion.div>

          {phase === "success" && (
            <motion.div
              className={styles.successWrap}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <motion.svg
                className={styles.checkmark}
                viewBox="0 0 52 52"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Círculo base estático para asegurar 360° */}
                <circle
                  className={styles.checkmarkCircleBase}
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                />

                {/* Círculo animado (sin gap) */}
                <motion.circle
                  className={styles.checkmarkCircle}
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  strokeLinecap="butt"          // ⬅️ clave para que cierre sin hueco
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />

                {/* Check */}
                <motion.path
                  className={styles.checkmarkCheck}
                  fill="none"
                  d="M14 27 l8 8 l16 -16"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
                />
              </motion.svg>
            </motion.div>
          )}

        </div>
      </IonContent>
    </IonPage>
  )
}

export default FacialRecognition
