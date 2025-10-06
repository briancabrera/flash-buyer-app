// src/pages/PaymentPin/PaymentPin.tsx
import React, { useRef, useState } from "react";
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonInput,
  IonText,
  IonButton,
  useIonRouter,
  useIonViewWillEnter,
  useIonViewDidLeave,
} from "@ionic/react";
import styles from "./PaymentPin.module.scss";

const PaymentPin: React.FC = () => {
  const ionRouter = useIonRouter();
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLIonInputElement>(null);

  // ——— Reset en cada entrada a la vista
  useIonViewWillEnter(() => {
    setPin("");
    // re-focus por UX
    setTimeout(() => inputRef.current?.setFocus?.(), 0);
  });

  // ——— Reset al salir (por cache del IonRouterOutlet)
  useIonViewDidLeave(() => {
    setPin("");
  });

  const setSanitizedPin = (val?: string | null) => {
    const digitsOnly = (val ?? "").replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
  };

  const handleContinue = () => {
    if (pin === "1234") {
      // opcional: limpiar antes de navegar
      setPin("");
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
                  ref={inputRef}
                  type="password"          // oculto con puntos
                  inputMode="numeric"      // teclado numérico
                  pattern="[0-9]*"
                  value={pin}
                  placeholder="••••"
                  maxlength={4}
                  onIonInput={(e) => setSanitizedPin(e.detail.value)}
                  onIonChange={(e) => setSanitizedPin(e.detail.value)}
                  className={styles.pinInput}
                  autofocus
                  clearOnEdit={false}
                  enterkeyhint="done"
                  // opcional: evita autocompletados raros
                  autocomplete="one-time-code"
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
