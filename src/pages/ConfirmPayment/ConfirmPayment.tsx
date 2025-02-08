"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { IonContent, IonPage, IonButton, IonSpinner } from "@ionic/react"
import { useHistory, useLocation } from "react-router-dom"
import Header from "../../components/Header/Header"
import { publishPayment } from "../../services/paymentService"
import styles from "./ConfirmPayment.module.scss"

interface LocationState {
  amount: string
}

const ConfirmPayment: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true)
  const [transactionResult, setTransactionResult] = useState<{ success: boolean; transactionId?: string } | null>(null)
  const history = useHistory()
  const location = useLocation<LocationState>()
  const amount = location.state?.amount

  useEffect(() => {
    const processPayment = async () => {
      if (amount) {
        try {
          const result = await publishPayment(Number.parseFloat(amount))
          setTransactionResult(result)
        } catch (error) {
          setTransactionResult({ success: false })
          console.log(error)
        }
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [amount])

  const handleNewPayment = () => {
    history.push("/home")
  }

  if (isProcessing) {
    return (
      <IonPage>
        <Header />
        <IonContent fullscreen>
          <div className={styles.container}>
            <IonSpinner name="circular" />
            <p>Procesando pago...</p>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <Header />
      <IonContent fullscreen>
        <div className={styles.container}>
          {transactionResult?.success ? (
            <>
              <h2>¡Pago exitoso!</h2>
              <p>Monto: ${amount}</p>
              <p>ID de transacción: {transactionResult.transactionId}</p>
            </>
          ) : (
            <h2>Error al procesar el pago</h2>
          )}
          <IonButton expand="block" onClick={handleNewPayment} className={styles.newPaymentButton}>
            Nuevo Pago
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default ConfirmPayment

