"use client"

import type React from "react"
import { useState } from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useHistory } from "react-router-dom"
import Header from "../../components/Header/Header"
import NumericKeypad from "../../components/NumericKeypad/NumericKeypad"
import styles from "./ChargePayment.module.scss"

const ChargePayment: React.FC = () => {
  const [amount, setAmount] = useState("")
  const history = useHistory()

  const handleKeyPress = (key: string) => {
    if (key === "C") {
      setAmount("")
    } else if (key === "." && amount.includes(".")) {
      return
    } else if (amount.includes(".") && amount.split(".")[1].length >= 2) {
      return
    } else {
      setAmount((prev) => prev + key)
    }
  }

  const handleConfirm = () => {
    if (amount && Number.parseFloat(amount) > 0) {
      history.push("/confirm", { amount })
    }
  }

  return (
    <IonPage>
      <Header />
      <IonContent fullscreen>
        <div className={styles.container}>
          <div className={styles.amountDisplay}>{amount || "0.00"}</div>
          <NumericKeypad onKeyPress={handleKeyPress} />
          <IonButton
            expand="block"
            onClick={handleConfirm}
            disabled={!amount || Number.parseFloat(amount) <= 0}
            className={styles.confirmButton}
          >
            Confirmar
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default ChargePayment

