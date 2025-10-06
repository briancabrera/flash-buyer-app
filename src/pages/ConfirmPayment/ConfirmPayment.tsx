"use client"

import type React from "react"
import { useState } from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useIonRouter } from "@ionic/react"
import PaymentConfirmationModal from "../../components/modals/PaymentConfirmationModal/PaymentConfirmationModal"
import { usePayment } from "../../context/PaymentContext"
import styles from "./ConfirmPayment.module.scss"
import { payCurrentPayment } from "../../services/payment.service"

const ConfirmPayment: React.FC = () => {
  const router = useIonRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "rejected" | "completed">("waiting")

  const { payment } = usePayment();
  const { amount, currency } = payment || { amount: "1500.00", currency: "UYU" };

  const handleConfirm = () => {
    setIsModalOpen(true)
    setPaymentStatus("waiting")
    try {
      payCurrentPayment();
      setTimeout(() => {
        setPaymentStatus("completed")
      }, 1200)
    } catch (e) {
      console.error("Payment error:", e);
      setPaymentStatus("rejected")
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    if (paymentStatus === "completed") {
      router.push("/home")
    }
  }

  const handleCancel = () => {
    router.push("/home")
  }

  const handleChangePaymentMethod = () => {
    router.push("/select-payment-method")
  }

  return (
    <IonPage className={styles.confirmPaymentPage}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <h1 className={styles.title}>Confirmar Pago</h1>

          <div className={styles.paymentDetails}>
            <div className={styles.amountCard}>
              <div className={styles.amount}>
                <span className={styles.currencySymbol}>$</span>
                <span className={styles.amountValue}>{amount}</span>
                <span className={styles.currency}>{currency}</span>
              </div>
              <div className={styles.currencyLabel}>Pesos Uruguayos</div>
              <div className={styles.cardInfo}>
                <div className={styles.cardBrand}>VISA</div>
                <div className={styles.cardNumber}>Termina en 4242</div>
              </div>
            </div>
          </div>

          <IonButton expand="block" className={styles.confirmButton} onClick={handleConfirm}>
            Confirmar Pago
          </IonButton>

          <div className={styles.helpButtons}>
            <IonButton expand="block" className={styles.changeMethodButton} onClick={handleChangePaymentMethod}>
              Cambiar método de pago
            </IonButton>
            <IonButton expand="block" className={styles.cancelButton} onClick={handleCancel}>
              Cancelar pago
            </IonButton>
          </div>
        </div>
      </IonContent>

      <PaymentConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        status={paymentStatus}
        amount={amount}
      />
    </IonPage>
  )
}

export default ConfirmPayment
