import type React from "react"
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from "@ionic/react"
import styles from "./Header.module.scss"

const Header: React.FC = () => {
  return (
    <IonHeader>
      <IonToolbar color="primary" className={styles.header}>
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>
        <IonTitle>Flash Vendor</IonTitle>
      </IonToolbar>
    </IonHeader>
  )
}

export default Header

