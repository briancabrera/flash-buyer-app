import type React from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useIonRouter } from "@ionic/react"
import styles from "./Home.module.scss"
import { isPosBuyerEnabled } from "../../services/featureFlags"

const Home: React.FC = () => {
  const router = useIonRouter()
  const posEnabled = isPosBuyerEnabled()

  const handlePosMode = () => {
    router.push("/pos")
  }

  const handleSettings = () => {
    router.push("/settings")
  }

  return (
    <IonPage className={styles.homePage}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <h1 className={styles.title}>Bienvenido a Flash</h1>
          <p className={styles.subtitle}>Modo POS</p>

          {posEnabled && (
            <IonButton expand="block" size="large" onClick={handlePosMode} className={styles.posButton}>
              POS Mode
            </IonButton>
          )}

          <IonButton expand="block" fill="outline" onClick={handleSettings} className={styles.posButton}>
            Settings
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Home

