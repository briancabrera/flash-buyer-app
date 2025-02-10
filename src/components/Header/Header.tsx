import type React from "react"
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from "@ionic/react"
import styles from "./Header.module.scss"

const Header: React.FC = () => {
  return (
    <IonHeader className={styles.header}>
      <IonToolbar>
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>
        <IonTitle>Flash</IonTitle>
      </IonToolbar>
    </IonHeader>
  )
}

export default Header

