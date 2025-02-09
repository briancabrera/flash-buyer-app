import { IonModal, IonSpinner, IonText, IonButton } from "@ionic/react"
import { CheckmarkCircle, CloseCircle } from "react-ionicons"
import styles from "./PaymentConfirmationModal.module.scss"

interface PaymentConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  status: "waiting" | "rejected" | "completed"
  amount: string
}

export default function PaymentConfirmationModal({ isOpen, onClose, status, amount }: PaymentConfirmationModalProps) {
  const renderContent = () => {
    switch (status) {
      case "waiting":
        return (
          <div className={styles.loadingContainer}>
            <IonSpinner name="crescent" />
            <IonText className={styles.statusText}>Esperando confirmación del pago...</IonText>
          </div>
        )
      case "rejected":
        return (
          <div className={styles.resultContainer}>
            <CloseCircle color={"#ef4444"} height="48px" width="48px" />
            <IonText className={styles.statusText}>Pago rechazado</IonText>
            <IonButton expand="block" onClick={onClose} className={styles.actionButton} color="medium">
              Cerrar
            </IonButton>
          </div>
        )
      case "completed":
        return (
          <div className={styles.resultContainer}>
            <CheckmarkCircle color={"#22c55e"} height="48px" width="48px" />
            <IonText className={styles.statusText}>Pago completado</IonText>
            <IonText className={styles.amountText}>${amount}</IonText>
            <IonButton expand="block" onClick={onClose} className={styles.actionButton} color="primary">
              Cerrar
            </IonButton>
          </div>
        )
    }
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      className={styles.modal}
    >
      <div className={styles.modalContent}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>Estado del Pago</h2>
        </div>
        {renderContent()}
      </div>
    </IonModal>
  )
}

