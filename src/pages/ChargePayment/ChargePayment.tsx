"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { IonContent, IonPage, IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from "@ionic/react"
import { useHistory } from "react-router-dom"
import Header from "../../components/Header/Header"
import NumericKeypad from "../../components/NumericKeypad/NumericKeypad"
import PaymentConfirmationModal from "../../components/modals/PaymentConfirmationModal/PaymentConfirmationModal"
import styles from "./ChargePayment.module.scss"
import { chevronBack } from "ionicons/icons"

const ChargePayment: React.FC = () => {
  const [amount, setAmount] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "rejected" | "completed">("waiting")
  const history = useHistory()

  const resetStates = useCallback(() => {
    setAmount([])
    setIsModalOpen(false)
    setPaymentStatus("waiting")
  }, [])

  useEffect(() => {
    // Limpiar estados cuando el componente se monta
    resetStates()

    // Limpiar estados cuando el componente se desmonta
    return () => {
      resetStates()
    }
  }, [resetStates])

  const handleKeyPress = (key: string) => {
    setAmount((prev) => {
      const newAmount = [...prev]
      newAmount.push(key)
      return newAmount
    })
  }

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setAmount([])
  }

  const handleConfirm = () => {
    setPaymentStatus("waiting")
    setIsModalOpen(true)
    // Simular el proceso de pago
    setTimeout(() => {
      const success = Math.random() > 0.5
      setPaymentStatus(success ? "completed" : "rejected")
    }, 3000)
  }

  const handleCancel = () => {
    resetStates()
    history.push("/home")
  }

  const formatDisplayAmount = (digits: string[]): number => {
    if (digits.length === 0) return 0

    const numberString = digits.join("").padStart(3, "0")
    const decimalPart = numberString.slice(-2)
    const integerPart = numberString.slice(0, -2) || "0"

    return Number(`${integerPart}.${decimalPart}`)
  }

  const displayAmount = formatDisplayAmount(amount).toFixed(2)

  const handleBack = () => history.goBack()
  
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

      <IonContent fullscreen>
        <div className={styles.container}>
          <div className={styles.amountDisplay}>{displayAmount}</div>
          <div className={styles.keypadContainer}>
            <NumericKeypad onKeyPress={handleKeyPress} onBackspace={handleBackspace} onClear={handleClear} />
            <div className={styles.buttonsContainer}>
              <IonButton
                expand="block"
                onClick={handleConfirm}
                disabled={formatDisplayAmount(amount) <= 0}
                className={styles.chargeButton}
              >
                Cargar Pago
              </IonButton>
              <IonButton expand="block" onClick={handleCancel} fill="clear" className={styles.cancelButton}>
                Cancelar
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
      <PaymentConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          if (paymentStatus === "completed") {
            resetStates()
            history.push("/home")
          }
        }}
        status={paymentStatus}
        amount={displayAmount}
      />
    </IonPage>
  )
}

export default ChargePayment

