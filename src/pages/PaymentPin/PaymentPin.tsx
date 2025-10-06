// src/pages/PaymentPin/PaymentPin.tsx
import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonInput,
  IonText,
  IonButton,
  useIonRouter,
} from "@ionic/react";
import styles from "./PaymentPin.module.scss";

const PaymentPin: React.FC = () => {
  const ionRouter = useIonRouter();
  const [pin, setPin] = useState("");

  const setSanitizedPin = (val?: string | null) => {
    const digitsOnly = (val ?? "").replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
  };

  const handleContinue = () => {
    if (pin === "1234") {
      ionRouter.push("/select-payment-method", "forward");
    }
  };

  const isReady = pin.length === 4 && pin === "1234";

  return (
    <IonPage>

      <IonContent fullscreen className={styles.content}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Código de seguridad</h1>
          <div className={styles.cardWrapper}>
            <IonCard className={styles.card}>
              <IonCardContent className={styles.cardContent}>
                <IonText color="medium" className={styles.message}>
                  Tu PIN protege tu cuenta. No lo compartas con nadie.
                </IonText>

                <IonInput
                  // ← Puntos/oculto
                  type="password"
                  // ← Teclado numérico
                  inputMode="numeric"
                  // Compatibilidad: algunos teclados usan pattern para sugerir numérico
                  // (lo dejamos aunque type sea password)
                  pattern="[0-9]*"
                  value={pin}
                  placeholder="••••"
                  maxlength={4}
                  // ← Actualiza en cada tecla, sin esperar blur
                  onIonInput={(e) => setSanitizedPin(e.detail.value)}
                  // (opcional) también por change, por compatibilidad
                  onIonChange={(e) => setSanitizedPin(e.detail.value)}
                  className={styles.pinInput}
                  autofocus
                  clearOnEdit={false}
                  enterkeyhint="done"
                />

                <IonButton
                  expand="block"
                  className={styles.nextButton}
                  disabled={!isReady}
                  onClick={handleContinue}
                >
                  Confirmar
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>

          <IonText className={styles.securityMessage}>
            Tus pagos están protegidos por reconocimiento facial. El PIN agrega
            una capa extra de seguridad para tu cuenta.
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PaymentPin;
