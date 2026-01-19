import type React from "react"
import styles from "./FaceCaptureView.module.scss"

type FaceCaptureViewProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  overlayOpacity?: number
  showScanBand?: boolean
  children?: React.ReactNode
}

export const FaceCaptureView: React.FC<FaceCaptureViewProps> = ({
  videoRef,
  overlayOpacity = 1,
  showScanBand = false,
  children,
}) => {
  return (
    <div className={styles.captureRoot}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.cameraFeed} />

      <div className={styles.overlay} style={{ opacity: overlayOpacity }}>
        <div className={styles.frame}>
          <div className={`${styles.corner} ${styles.tl}`} />
          <div className={`${styles.corner} ${styles.tr}`} />
          <div className={`${styles.corner} ${styles.bl}`} />
          <div className={`${styles.corner} ${styles.br}`} />
          {showScanBand && <div className={styles.scanBand} />}
        </div>
      </div>

      {children}
    </div>
  )
}
