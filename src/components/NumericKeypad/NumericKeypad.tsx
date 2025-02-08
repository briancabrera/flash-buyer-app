import type React from "react"
import { IonButton, IonGrid, IonRow, IonCol } from "@ionic/react"
import styles from "./NumericKeypad.module.scss"

interface NumericKeypadProps {
  onKeyPress: (key: string) => void
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress }) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "C"]

  return (
    <IonGrid className={styles.keypad}>
      {keys.map((key, index) => (
        <IonRow key={index}>
          <IonCol>
            <IonButton expand="block" onClick={() => onKeyPress(key)} className={styles.key}>
              {key}
            </IonButton>
          </IonCol>
        </IonRow>
      ))}
    </IonGrid>
  )
}

export default NumericKeypad

