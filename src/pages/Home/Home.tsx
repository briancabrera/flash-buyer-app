import type React from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useIonRouter } from "@ionic/react"
import styles from "./Home.module.scss"

const Home: React.FC = () => {
  const router = useIonRouter()

  const handlePay = () => {
    router.push('/facial-recognition');
  }

  return (
    <IonPage className={styles.homePage}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <h1 className={styles.title}>Bienvenido a Flash</h1>
          <p className={styles.subtitle}>Paga rápido y seguro con reconocimiento facial</p>
          <IonButton expand="block" size="large" onClick={handlePay} className={styles.payButton}>
            Pagar
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Home

