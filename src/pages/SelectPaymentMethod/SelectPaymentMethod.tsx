"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { IonContent, IonPage, IonSpinner } from "@ionic/react"
import { useIonRouter } from "@ionic/react"
import { ChevronRightIcon } from "lucide-react"
import styles from "./SelectPaymentMethod.module.scss"

interface Card {
  id: string
  last4: string
  brand: string
}

const SelectPaymentMethod: React.FC = () => {
  const router = useIonRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    setTimeout(() => {
      const mockCards = [
        { id: "1", last4: "4242", brand: "visa" },
        { id: "2", last4: "6789", brand: "mastercard" }
      ]

      setCards(mockCards)
      setIsLoading(false)

      if (mockCards.length === 1) {
        router.push("/confirm-payment", "forward", "push")
      }
    }, 2000)
  }, [router])

  const handleCardSelect = (cardId: string) => {
    router.push("/confirm-payment", "forward", "push")
  }

  if (isLoading) {
    return (
      <IonPage className={styles.selectPaymentMethodPage}>
        <IonContent fullscreen>
          <div className={styles.loadingContainer}>
            <IonSpinner name="crescent" />
            <p>Cargando métodos de pago...</p>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage className={styles.selectPaymentMethodPage}>
      <IonContent fullscreen>
        <div className={styles.container}>
          <h1 className={styles.title}>Selecciona un método de pago</h1>
          <div className={styles.cardListContainer}>
            {cards.map((card) => (
              <div key={card.id} className={styles.cardItem} onClick={() => handleCardSelect(card.id)}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardBrand}>{card.brand.toUpperCase()}</div>
                  <div className={styles.cardNumber}>Termina en {card.last4}</div>
                </div>
                <ChevronRightIcon className={styles.chevron} />
              </div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default SelectPaymentMethod

