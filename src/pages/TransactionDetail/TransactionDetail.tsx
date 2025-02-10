"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonText,
  IonChip,
  IonLabel,
  IonModal,
  useIonAlert,
} from "@ionic/react"
import { chevronBack, timeOutline, cardOutline, documentTextOutline } from "ionicons/icons"
import { motion } from "framer-motion"
import { useHistory, useParams } from "react-router"
import { Capacitor } from "@capacitor/core"
import { Share } from "@capacitor/share"
import styles from "./TransactionDetail.module.scss"
import FloatingLightningBolts from "../../components/FloatingLightningBolts/FloatingLightningBolts"
import { formatAmount } from "../../utils/formatters"
import { generateTransactionReceipt } from "../../utils/pdfGenerator"

const TransactionDetail: React.FC = () => {
  const history = useHistory()
  const { id } = useParams<{ id: string }>()
  const [presentAlert] = useIonAlert()
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState("")

  // Mocked data (replace with actual data fetching logic)
  const transaction = {
    id: "TX-001",
    description: "Pago en ANCAP",
    amount: 1500,
    status: "completed" as "completed" | "pending" | "rejected",
    cardName: "Tarjeta Flash",
    cardLastDigits: "1234",
    date: "16 Nov, 2025",
    time: "14:30",
    reference: "REF123456789",
  }

  const handleBack = () => history.goBack()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
        return "danger"
      default:
        return "medium"
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case "completed":
        return "Completado"
      case "pending":
        return "Pendiente"
      case "rejected":
        return "Rechazado"
      default:
        return "Estado no disponible"
    }
  }

  const handleViewReceipt = async () => {
    try {
      const pdfDataUrl = await generateTransactionReceipt(transaction)
      setPdfUrl(pdfDataUrl)
      setShowPdfModal(true)
    } catch (error) {
      console.error("Error al generar el comprobante:", error)
      presentAlert({
        header: "Error",
        message: "Hubo un problema al generar el comprobante.",
        buttons: ["OK"],
      })
    }
  }

  const handleShareReceipt = async () => {
    try {
      const pdfDataUrl = await generateTransactionReceipt(transaction)

      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: "Comprobante de transacción",
          text: "Aquí está tu comprobante de transacción de Flash",
          url: pdfDataUrl,
          dialogTitle: "Compartir comprobante",
        })
      } else {
        // For web browsers, open the PDF in a new tab
        window.open(pdfDataUrl, "_blank")
      }
    } catch (error) {
      console.error("Error al compartir el comprobante:", error)
      presentAlert({
        header: "Error",
        message: "Hubo un problema al compartir el comprobante.",
        buttons: ["OK"],
      })
    }
  }

  const handleRefund = () => {
    history.push("/refund", { transactionId: transaction.id })
  }

  return (
    <IonPage>
      <IonHeader className={styles.header}>
        <IonToolbar>
          <IonTitle>Flash</IonTitle>
          <IonButtons slot="start">
            <IonButton className={styles.backButton} onClick={handleBack}>
              <IonIcon className={styles.backIcon} icon={chevronBack} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className={styles.detailPage}>
        <h1 className={styles.title}>Detalle de transacción</h1>
        <div className={styles.pageContent}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <IonCard className={styles.mainCard}>
              <IonCardContent>
                <h1 className={styles.amount}>{formatAmount(transaction.amount)}</h1>
                <p className={styles.description}>{transaction.description}</p>
                <IonChip color={getStatusColor(transaction.status)} className={styles.statusChip}>
                  <IonLabel>{getStatusText(transaction.status)}</IonLabel>
                </IonChip>
              </IonCardContent>
            </IonCard>

            <IonCard className={styles.detailsCard}>
              <IonCardContent>
                <div className={styles.detailItem}>
                  <IonIcon icon={timeOutline} />
                  <div>
                    <IonText color="medium">Fecha y hora</IonText>
                    <p>
                      {transaction.date} - {transaction.time}
                    </p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <IonIcon icon={cardOutline} />
                  <div>
                    <IonText color="medium">Tarjeta</IonText>
                    <p>
                      {transaction.cardName} •••• {transaction.cardLastDigits}
                    </p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <IonIcon icon={documentTextOutline} />
                  <div>
                    <IonText color="medium">Referencia</IonText>
                    <p>{transaction.reference}</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <div className={styles.actions}>
              {transaction.status === "completed" && (
                <IonButton expand="block" className={styles.refundButton} onClick={handleRefund}>
                  Realizar devolución
                </IonButton>
              )}
              <IonButton expand="block" className={styles.downloadButton} onClick={handleViewReceipt}>
                Ver comprobante
              </IonButton>
              <IonButton expand="block" className={styles.downloadButton} onClick={handleShareReceipt}>
                Compartir comprobante
              </IonButton>
            </div>
          </motion.div>
        </div>
      </IonContent>

      <IonModal isOpen={showPdfModal} onDidDismiss={() => setShowPdfModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Comprobante de Transacción</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowPdfModal(false)}>Cerrar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <iframe src={pdfUrl} style={{ width: "100%", height: "100%", border: "none" }} />
        </IonContent>
      </IonModal>
    </IonPage>
  )
}

export default TransactionDetail

