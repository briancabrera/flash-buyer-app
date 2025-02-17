"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { IonContent, IonPage } from "@ionic/react"
import { useIonRouter } from "@ionic/react"
import styles from "./FacialRecognition.module.scss"

const FacialRecognition: React.FC = () => {
  const router = useIonRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isRecognitionComplete, setIsRecognitionComplete] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Simulamos el proceso de reconocimiento facial
        setTimeout(() => {
          setIsRecognitionComplete(true)
        }, 3000)
      } catch (err) {
        console.error("Error accessing the camera", err)
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (isRecognitionComplete) {
      const videoElement = videoRef.current
      if (videoElement && videoElement.srcObject instanceof MediaStream) {
        const stream = videoElement.srcObject
        stream.getTracks().forEach((track) => track.stop())
      }
      router.push("/select-payment-method")
    }
  }, [isRecognitionComplete])

  return (
    <IonPage className={styles.facialRecognitionPage}>
      <IonContent fullscreen>
        <div className={styles.pageTitle}>Reconocimiento Facial</div>
        <div className={styles.container}>
          <video ref={videoRef} autoPlay playsInline muted className={styles.cameraFeed} />
        </div>
      </IonContent>
    </IonPage>
  )
}

export default FacialRecognition

