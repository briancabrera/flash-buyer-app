import type React from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useIonRouter } from "@ionic/react"
import styles from "./Home.module.scss"
import { isPosBuyerEnabled } from "../../services/featureFlags"

const Home: React.FC = () => {
  const router = useIonRouter()
  const posEnabled = isPosBuyerEnabled()

  const handlePay = () => {
    router.push('/facial-recognition');
  }

  const handlePosDebug = () => {
    router.push("/pos-debug")
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
          {posEnabled && (
            <IonButton expand="block" size="large" onClick={handlePosDebug} className={styles.posButton}>
              POS Debug
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Home

