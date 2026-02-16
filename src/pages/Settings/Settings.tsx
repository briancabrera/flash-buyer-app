import { IonButton, IonContent, IonPage, IonText, useIonRouter } from "@ionic/react"
import { clearTerminalToken } from "../../lib/terminalTokenStore"
import { invalidateTerminalTokenCache } from "../../lib/api"
import { stopTerminalSse } from "../../hooks/useTerminalSse"

export default function Settings() {
  const router = useIonRouter()

  const unpair = async () => {
    try {
      stopTerminalSse()
    } catch {
      // ignore
    }
    await clearTerminalToken()
    invalidateTerminalTokenCache()
    // Hard reload ensures all module-level singletons reset (SSE store, caches, etc).
    window.location.href = "/"
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 18px" }}>
          <IonText>
            <h2 style={{ margin: 0, fontWeight: 800 }}>Settings</h2>
          </IonText>
          <IonText color="medium">
            <p style={{ marginTop: 8 }}>
              Operaciones / desarrollo. Si cambiás de terminal o el token fue rotado, despareá este dispositivo.
            </p>
          </IonText>

          <IonButton expand="block" color="danger" onClick={() => void unpair()}>
            Unpair Terminal
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => router.goBack()}>
            Back
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

