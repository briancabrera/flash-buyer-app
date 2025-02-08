"use client"

import type React from "react"
import { useState } from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useHistory } from "react-router-dom"
import Header from "../../components/Header/Header"
import NumericKeypad from "../../components/NumericKeypad/NumericKeypad"
import styles from "./ChargePayment.module.scss"

const ChargePayment: React.FC = () => {
  const [amount, setAmount] = useState<string[]>([])
  const history = useHistory()

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
    const value = formatDisplayAmount(amount)
    if (value > 0) {
      history.push("/confirm", { amount: value.toString() })
    }
  }

  const handleCancel = () => {
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

  return (
    <IonPage>
      <Header />
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
    </IonPage>
  )
}

export default ChargePayment

