import { useRef, useEffect, useMemo, useState } from "react";
import {
  IonContent,
  IonPage,
  IonButton,
  useIonViewWillEnter,
  useIonViewDidEnter,
  useIonViewWillLeave,
  useIonViewDidLeave,
} from "@ionic/react";
import { useIonRouter } from "@ionic/react";
import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { fetchCurrentPayment } from "../../services/payment.service";
import { usePayment } from "../../context/PaymentContext";
import { captureFrameFromVideo } from "../../utils/captureFrame";
import { clearFaceCaptureCallbacks, getFaceCaptureCallbacks, type FaceCaptureCallbacks } from "../../utils/faceCaptureBridge";
import { FaceCaptureView } from "../../components/FaceCaptureView/FaceCaptureView";
import styles from "./FacialRecognition.module.scss";

type Phase = "boot" | "scanning" | "success";

const FacialRecognition: React.FC = () => {
  const router = useIonRouter();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toSuccessRef = useRef<number | null>(null);
  const toRouteRef = useRef<number | null>(null);
  const hasNavigatedRef = useRef(false);
  const isActiveRef = useRef(false);

  const { setPayment } = usePayment();

  const [phase, setPhase] = useState<Phase>("boot");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const captureCallbacksRef = useRef<FaceCaptureCallbacks | null>(null);
  const isCaptureMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("capture") === "1" || params.get("mode") === "capture";
  }, [location.search]);
  const autoCapture = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("auto") === "1";
  }, [location.search]);
  const hasAutoCapturedRef = useRef(false);
  const autoCaptureTimerRef = useRef<number | null>(null);

  const clearAllTimers = () => {
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
    if (hasNavigatedRef.current || !isActiveRef.current) return;
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

  const handleCapture = () => {
    if (!isActiveRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      setCaptureError(null);
      if (!captureCallbacksRef.current) {
        setCaptureError("No capture callbacks found. Please retry from PosDebug.");
        return;
      }
      const captured = captureFrameFromVideo(v, {
        targetWidth: 720,
        jpegQuality: 0.7,
        maxBase64Length: 1_000_000,
      });
    captureCallbacksRef.current?.onCapture?.({
        dataUrl: captured.dataUrl,
        imageBase64: captured.imageBase64,
        base64Length: captured.base64Length,
        width: captured.width,
        height: captured.height,
      });
      clearFaceCaptureCallbacks();
      captureCallbacksRef.current = null;
      router.push("/pos-debug", "back");
    } catch (err) {
      setCaptureError(String(err));
    }
  };

  const handleCancel = () => {
    captureCallbacksRef.current?.onCancel?.();
    clearFaceCaptureCallbacks();
    captureCallbacksRef.current = null;
    router.push("/pos-debug", "back");
  };

  // ---------- lifecycle: ENTER ----------
  const onVisibilityRef = useRef<() => void>();
  useIonViewWillEnter(() => {
    // Reset TOTAL antes de mostrar la vista
    isActiveRef.current = true;
    hasNavigatedRef.current = false;
    setPhase("boot");
    setIsCameraReady(false);
    setCaptureError(null);
    captureCallbacksRef.current = getFaceCaptureCallbacks();
    hasAutoCapturedRef.current = false;
  });

  useIonViewDidEnter(() => {
    // Arrancamos listeners + cámara en cada entrada
    const onVisibility = () => { if (document.hidden) stopCamera(); };
    onVisibilityRef.current = onVisibility;
    document.addEventListener("visibilitychange", onVisibility);

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!isActiveRef.current) return;
        streamRef.current = stream;

        const v = videoRef.current;
        if (v) {
          v.srcObject = stream as any;
          const onCanPlay = () => {
            if (!isActiveRef.current) return;
            setIsCameraReady(true);
            setPhase("scanning");
            if (!isCaptureMode) {
              // 3s de escaneo → éxito
              toSuccessRef.current = window.setTimeout(() => {
                if (!isActiveRef.current) return;
                setPhase("success");
                toRouteRef.current = window.setTimeout(() => {
                  if (!isActiveRef.current) return;
                  stopCamera();
                  handleFaceOk();
                }, 1200);
              }, 3000);
            }
          };
          v.addEventListener("canplay", onCanPlay, { once: true });
          v.play?.().catch(() => {});
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (!isActiveRef.current) return;
        setIsCameraReady(false);
        setPhase("scanning");
        if (!isCaptureMode) {
          toSuccessRef.current = window.setTimeout(() => {
            if (!isActiveRef.current) return;
            setPhase("success");
            toRouteRef.current = window.setTimeout(() => {
              if (!isActiveRef.current) return;
              handleFaceOk();
            }, 1200);
          }, 3000);
        }
      }
    };

    start();
  });

  // ---------- lifecycle: LEAVE ----------
  useIonViewWillLeave(() => {
    isActiveRef.current = false;
    clearAllTimers();
    if (onVisibilityRef.current) document.removeEventListener("visibilitychange", onVisibilityRef.current);
    stopCamera();
  });

  useIonViewDidLeave(() => {
    // redundante a propósito (algunos flows llaman solo uno)
    isActiveRef.current = false;
    clearAllTimers();
    if (onVisibilityRef.current) document.removeEventListener("visibilitychange", onVisibilityRef.current);
    stopCamera();
  });

  // (opcional) respaldo si alguna vez se desmonta de verdad
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      clearAllTimers();
      if (onVisibilityRef.current) document.removeEventListener("visibilitychange", onVisibilityRef.current);
      if (autoCaptureTimerRef.current) {
        window.clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isCaptureMode || !autoCapture) return;
    if (!isCameraReady) return;
    if (hasAutoCapturedRef.current) return;
    hasAutoCapturedRef.current = true;
    autoCaptureTimerRef.current = window.setTimeout(() => {
      if (!captureCallbacksRef.current) {
        setCaptureError("Auto-capture failed: missing callbacks. Please retry.");
        return;
      }
      handleCapture();
      autoCaptureTimerRef.current = null;
    }, 500);
    return () => {
      if (autoCaptureTimerRef.current) {
        window.clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
    };
  }, [autoCapture, isCameraReady, isCaptureMode]);

  const overlayOpacity = !isCameraReady ? 0 : phase === "success" ? 0 : 1;

  return (
    <IonPage className={styles.facialRecognitionPage}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <FaceCaptureView videoRef={videoRef} overlayOpacity={overlayOpacity} isScanning={phase === "scanning"} />

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

          {isCaptureMode && (
            <div className={styles.captureControls}>
              <div className={styles.captureRow}>
                {!autoCapture && (
                  <IonButton onClick={handleCapture} disabled={!isCameraReady}>
                    Capture
                  </IonButton>
                )}
                <IonButton color="medium" onClick={handleCancel}>
                  Cancel
                </IonButton>
              </div>
              {autoCapture && !captureError && <div className={styles.captureHint}>Auto scanning…</div>}
              {captureError && <div className={styles.captureError}>{captureError}</div>}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FacialRecognition;
