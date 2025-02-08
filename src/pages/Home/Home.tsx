"use client"

import type React from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useHistory } from "react-router-dom"
import Header from "../../components/Header/Header"
import styles from "./Home.module.scss"

const Home: React.FC = () => {
  const history = useHistory()

  const handleChargePayment = () => {
    history.push("/charge")
  }

  return (
    <IonPage>
      <Header />
      <IonContent fullscreen>
        <div className={styles.container}>
          <IonButton expand="block" size="large" onClick={handleChargePayment} className={styles.chargeButton}>
            Cargar Pago
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Home

