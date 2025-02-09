import { IonButton, IonInput, IonSpinner, IonText } from "@ionic/react"
import { motion } from "framer-motion"
import type React from "react" // Added import for React
import styles from "./TransactionIdPrompt.module.scss"

interface TransactionIdPromptProps {
  onSubmit: (id: string) => void
  isLoading: boolean
  error?: string
}

export default function TransactionIdPrompt({ onSubmit, isLoading, error }: TransactionIdPromptProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const input = form.elements.namedItem("transactionId") as HTMLInputElement
    if (input.value) {
      onSubmit(input.value)
    }
  }

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className={styles.content}>
        <h2 className={styles.title}>Ingrese ID de transacción</h2>
        <p className={styles.description}>Ingrese el ID de la transacción para la cual desea realizar la devolución</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <IonInput
            name="transactionId"
            type="text"
            placeholder="Ej: TX-001"
            className={styles.input}
            disabled={isLoading}
          />

          {error && (
            <IonText color="danger" className={styles.error}>
              {error}
            </IonText>
          )}

          <IonButton type="submit" expand="block" disabled={isLoading} className={styles.submitButton}>
            {isLoading ? <IonSpinner name="crescent" /> : "Continuar"}
          </IonButton>
        </form>
      </div>
    </motion.div>
  )
}

