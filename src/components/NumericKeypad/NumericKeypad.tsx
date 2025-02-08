import type React from "react"
import { IonButton } from "@ionic/react"
import { X, Delete } from "lucide-react"
import styles from "./NumericKeypad.module.scss"

interface NumericKeypadProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress, onBackspace, onClear }) => {
  return (
    <div className={styles.keypad}>
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <IonButton key={num} className={styles.key} onClick={() => onKeyPress(num.toString())} fill="clear">
            {num}
          </IonButton>
        ))}
        <IonButton className={`${styles.key} ${styles.dangerKey}`} onClick={onClear} fill="clear">
          <X className={styles.icon} />
        </IonButton>
        <IonButton className={styles.key} onClick={() => onKeyPress("0")} fill="clear">
          0
        </IonButton>
        <IonButton className={`${styles.key} ${styles.warningKey}`} onClick={onBackspace} fill="clear">
          <Delete className={styles.icon} />
        </IonButton>
      </div>
    </div>
  )
}

export default NumericKeypad

