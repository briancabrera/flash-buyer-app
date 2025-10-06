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
import { fetchCurrentPayment } from "../../services/payment.service"
import { usePayment } from "../../context/PaymentContext"
import styles from "./FacialRecognition.module.scss"

type Phase = "boot" | "scanning" | "success"

const FacialRecognition: React.FC = () => {
  const router = useIonRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toSuccessRef = useRef<number | null>(null);
  const toRouteRef = useRef<number | null>(null);
  const hasNavigatedRef = useRef(false);   // ⬅️ evita dobles GET/navegación
  const isActiveRef = useRef(true);        // ⬅️ cancela trabajo si la vista se fue

  const { setPayment } = usePayment();

  const [phase, setPhase] = useState<"boot" | "scanning" | "success">("boot");
  const [isCameraReady, setIsCameraReady] = useState(false);

  const clearAllTimers: () => void = () => {
    if (toSuccessRef.current) { window.clearTimeout(toSuccessRef.current); toSuccessRef.current = null; }
    if (toRouteRef.current)   { window.clearTimeout(toRouteRef.current);   toRouteRef.current = null; }
  };

  const stopCamera = () => {
    try {
      const stream = streamRef.current;
      if (stream) stream.getTracks().forEach(t => { try { t.stop() } catch {} });
      streamRef.current = null;
      const v = videoRef.current;
      if (v) {
        try { v.pause() } catch {}
        v.srcObject = null as any;
        try { v.removeAttribute("src") } catch {}
        try { v.load?.() } catch {}
      }
    } catch (e) {
      console.warn("stopCamera error:", e);
    }
  };

  const handleFaceOk = async () => {
    if (hasNavigatedRef.current || !isActiveRef.current) return; // ⬅️ guard crítico
    hasNavigatedRef.current = true;

    try {
      const payment = await fetchCurrentPayment();
      setPayment(payment);
      router.push(payment.pin_required ? "/payment-pin" : "/select-payment-method", "forward");
    } catch (e) {
      console.error(e);
      // TODO: toast / fallback
    }
  };

  useIonViewWillLeave(() => {
    // La vista sale de foco pero NO se desmonta ⇒ limpiamos acá
    isActiveRef.current = false;
    clearAllTimers();
    document.removeEventListener("visibilitychange", onVisibilityRef.current!);
    stopCamera();
  });

  useIonViewDidLeave(() => {
    // Doble seguridad (algunos flows disparan WillLeave pero no DidLeave inmediatamente)
    isActiveRef.current = false;
    clearAllTimers();
    stopCamera();
  });

  const onVisibilityRef = useRef<() => void>();
  useEffect(() => {
    isActiveRef.current = true;
    hasNavigatedRef.current = false;

    const onVisibility = () => { if (document.hidden) stopCamera(); };
    onVisibilityRef.current = onVisibility;
    document.addEventListener("visibilitychange", onVisibility);

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (!isActiveRef.current) return; // si la vista ya salió, abortar
        streamRef.current = stream;

        const v = videoRef.current;
        if (v) {
          v.srcObject = stream as any;
          const onCanPlay = () => {
            if (!isActiveRef.current) return;
            setIsCameraReady(true);
            setPhase("scanning");

            // 3s de escaneo → éxito
            toSuccessRef.current = window.setTimeout(() => {
              if (!isActiveRef.current) return;
              setPhase("success");
              // esperamos 1.2s para el tick y navegamos
              toRouteRef.current = window.setTimeout(() => {
                if (!isActiveRef.current) return;
                stopCamera();
                handleFaceOk();
              }, 1200);
            }, 3000);
          };
          v.addEventListener("canplay", onCanPlay, { once: true });
          v.play?.().catch(() => {});
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (!isActiveRef.current) return;
        setIsCameraReady(false);
        setPhase("scanning");
        toSuccessRef.current = window.setTimeout(() => {
          if (!isActiveRef.current) return;
          setPhase("success");
          toRouteRef.current = window.setTimeout(() => {
            if (!isActiveRef.current) return;
            handleFaceOk();
          }, 1200);
        }, 3000);
      }
    };

    start();

    return () => {
      // OJO: en Ionic esto puede no correr al navegar (no hay unmount),
      // pero si la vista se desmonta por cualquier razón, igual limpiamos.
      isActiveRef.current = false;
      clearAllTimers();
      document.removeEventListener("visibilitychange", onVisibility);
      stopCamera();
    };
  }, []);

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
