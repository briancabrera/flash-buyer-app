"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { IonContent, IonPage, IonButton } from "@ionic/react"
import { useHistory } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Header from "../../components/Header/Header"
import NumericKeypad from "../../components/NumericKeypad/NumericKeypad"
import PaymentConfirmationModal from "../../components/modals/PaymentConfirmationModal/PaymentConfirmationModal"
import TransactionIdPrompt from "../../components/modals/TransactionIdPrompt/TransactionIdPrompt"
import FloatingLightningBolts from "../../components/FloatingLightningBolts/FloatingLightningBolts"
import { findTransactionById, processRefund } from "../../services/transactionService"
import styles from "./Refund.module.scss"

const Refund: React.FC = () => {
  const [amount, setAmount] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "rejected" | "completed">("waiting")
  const [showPrompt, setShowPrompt] = useState(true)
  const [promptError, setPromptError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [transaction, setTransaction] = useState<{
    id: string
    amount: number
  } | null>(null)
  const history = useHistory()

  const resetStates = useCallback(() => {
    setAmount([])
    setIsModalOpen(false)
    setPaymentStatus("waiting")
    setShowPrompt(true)
    setPromptError(undefined)
    setIsLoading(false)
    setTransaction(null)
  }, [])

  useEffect(() => {
    // Reset states when component mounts
    resetStates()

    // Cleanup function to reset states when component unmounts
    return resetStates
  }, [resetStates])

  const handleTransactionIdSubmit = async (id: string) => {
    setIsLoading(true)
    setPromptError(undefined)

    try {
      const result = await findTransactionById(id)
      if (result.success && result.transaction) {
        setTransaction(result.transaction)
        setShowPrompt(false)
      } else {
        setPromptError(result.error || "Error al buscar la transacción")
      }
    } catch (error) {
      setPromptError("Error al buscar la transacción")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (key: string) => {
    if (!transaction) return

    setAmount((prev) => {
      const newAmount = [...prev]
      newAmount.push(key)
      const value = formatDisplayAmount(newAmount)

      // No permitir valores mayores al monto de la transacción original
      if (value > transaction.amount) {
        return prev
      }

      return newAmount
    })
  }

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setAmount([])
  }

  const handleConfirm = async () => {
    if (!transaction) return

    setPaymentStatus("waiting")
    setIsModalOpen(true)

    try {
      const result = await processRefund(transaction.id, formatDisplayAmount(amount))
      setPaymentStatus(result.success ? "completed" : "rejected")
    } catch (error) {
      setPaymentStatus("rejected")
    }
  }

  const handleCancel = () => {
    resetStates()
    history.push("/home")
  }

  const formatDisplayAmount = (digits: string[]): number => {
    if (digits.length === 0) return 0

    const numberString = digits.join("").padStart(3, "0")
    const decimalPart = numberString.slice(-2)
    const integerPart = numberString.slice(0, -2) || "0"

    return Number(`${integerPart}.${decimalPart}`)
  }

  const displayAmount = formatDisplayAmount(amount).toFixed(2)

  return (
    <IonPage className={styles.refundPage}>
      <Header />
      <IonContent fullscreen>
        <AnimatePresence mode="wait">
          {showPrompt ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TransactionIdPrompt onSubmit={handleTransactionIdSubmit} isLoading={isLoading} error={promptError} />
            </motion.div>
          ) : (
            <motion.div
              key="keypad"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={styles.container}
            >
              <div className={styles.amountDisplay}>{displayAmount}</div>
              <div className={styles.keypadContainer}>
                <NumericKeypad onKeyPress={handleKeyPress} onBackspace={handleBackspace} onClear={handleClear} />
                <div className={styles.buttonsContainer}>
                  <IonButton
                    expand="block"
                    onClick={handleConfirm}
                    disabled={formatDisplayAmount(amount) <= 0}
                    className={styles.refundButton}
                  >
                    Procesar Devolución
                  </IonButton>
                  <IonButton expand="block" onClick={handleCancel} fill="clear" className={styles.cancelButton}>
                    Cancelar
                  </IonButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
      <PaymentConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          if (paymentStatus === "completed") {
            history.push("/home")
          }
        }}
        status={paymentStatus}
        amount={displayAmount}
      />
    </IonPage>
  )
}

export default Refund

