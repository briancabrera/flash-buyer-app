import type React from "react"
import styles from "./FaceCaptureView.module.scss"

type FaceCaptureViewProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  overlayOpacity?: number
  isScanning?: boolean
  children?: React.ReactNode
}

export const FaceCaptureView: React.FC<FaceCaptureViewProps> = ({
  videoRef,
  overlayOpacity = 1,
  isScanning = false,
  children,
}) => {
  return (
    <div className={styles.captureRoot}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.cameraFeed} />

      <div className={styles.overlay} style={{ opacity: overlayOpacity }}>
        <div className={`${styles.frame} ${isScanning ? styles.frameScanning : ""}`}>
          <div className={`${styles.corner} ${styles.tl}`} />
          <div className={`${styles.corner} ${styles.tr}`} />
          <div className={`${styles.corner} ${styles.bl}`} />
          <div className={`${styles.corner} ${styles.br}`} />
        </div>
      </div>

      {children}
    </div>
  )
}
