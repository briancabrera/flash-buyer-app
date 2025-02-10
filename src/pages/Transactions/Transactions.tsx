"use client"

import type React from "react"
import { useMemo, useState } from "react"
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
} from "@ionic/react"
import { chevronBack, chevronForward, searchOutline } from "ionicons/icons"
import { motion } from "framer-motion"
import { useHistory } from "react-router"
import FloatingLightningBolts from "../../components/FloatingLightningBolts/FloatingLightningBolts"
import styles from "./Transactions.module.scss"

type TransactionStatus = "rejected" | "pending" | "completed"

interface FilterState {
  transactionId: string
  timeFrom: string
  timeTo: string
}

const getStatusText = (status: TransactionStatus) => {
  switch (status) {
    case "rejected":
      return "Rechazado"
    case "pending":
      return "En curso"
    case "completed":
      return "Completado"
    default:
      return ""
  }
}

// Mock data for transactions
const transactions = [
  {
    id: "TX-001",
    amount: 1500,
    status: "completed" as TransactionStatus,
    timestamp: "2025-02-09T10:30:15",
  },
  {
    id: "TX-002",
    amount: 2000,
    status: "completed" as TransactionStatus,
    timestamp: "2025-02-09T11:45:30",
  },
  {
    id: "TX-003",
    amount: 500,
    status: "rejected" as TransactionStatus,
    timestamp: "2025-02-09T14:15:45",
  },
  {
    id: "TX-004",
    amount: 3000,
    status: "pending" as TransactionStatus,
    timestamp: "2025-02-09T16:00:20",
  },
]

const Transactions: React.FC = () => {
  const history = useHistory()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    transactionId: "",
    timeFrom: "",
    timeTo: "",
  })

  const handleBack = () => history.goBack()

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const handleTransactionClick = (transactionId: string) => {
    history.push(`/transaction/${transactionId}`)
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Filter by transaction ID
      if (filters.transactionId && !transaction.id.toLowerCase().includes(filters.transactionId.toLowerCase())) {
        return false
      }

      // Filter by time range
      if (filters.timeFrom || filters.timeTo) {
        const transactionTime = new Date(transaction.timestamp)
        if (filters.timeFrom) {
          const fromTime = new Date(`2025-02-09T${filters.timeFrom}`)
          if (transactionTime < fromTime) return false
        }
        if (filters.timeTo) {
          const toTime = new Date(`2025-02-09T${filters.timeTo}`)
          if (transactionTime > toTime) return false
        }
      }

      return true
    })
  }, [filters])

  const memoizedFloatingLightningBolts = useMemo(() => <FloatingLightningBolts />, [])

  return (
    <IonPage>
      <IonHeader className={styles.header}>
        <IonToolbar>
          <IonTitle className={styles.title}>Flash Vendor</IonTitle>
          <IonButtons slot="start">
            <IonButton className={styles.backButton} onClick={handleBack}>
              <IonIcon icon={chevronBack} className={styles.backIcon} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton className={styles.filterButton} onClick={() => setShowFilters(!showFilters)}>
              <IonIcon icon={searchOutline} className={styles.filterIcon} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className={styles.transactionsPage}>
        <div className={styles.pageContent}>
          <h1 className={styles.pageTitle}>Transacciones</h1>

          {showFilters && (
            <motion.div
              className={styles.filters}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IonItem className={styles.filterItem}>
                <IonLabel position="stacked">ID de Transacción</IonLabel>
                <IonInput
                  value={filters.transactionId}
                  onIonInput={(e) => setFilters((prev) => ({ ...prev, transactionId: e.detail.value || "" }))}
                  placeholder="Buscar por ID..."
                  className={styles.filterInput}
                />
              </IonItem>
              <div className={styles.timeFilters}>
                <IonItem className={styles.filterItem}>
                  <IonLabel position="stacked">Desde</IonLabel>
                  <IonInput
                    type="time"
                    value={filters.timeFrom}
                    onIonInput={(e) => setFilters((prev) => ({ ...prev, timeFrom: e.detail.value || "" }))}
                    className={styles.filterInput}
                  />
                </IonItem>
                <IonItem className={styles.filterItem}>
                  <IonLabel position="stacked">Hasta</IonLabel>
                  <IonInput
                    type="time"
                    value={filters.timeTo}
                    onIonInput={(e) => setFilters((prev) => ({ ...prev, timeTo: e.detail.value || "" }))}
                    className={styles.filterInput}
                  />
                </IonItem>
              </div>
            </motion.div>
          )}

          <div className={styles.transactionsList}>
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <IonCard className={styles.transactionCard} onClick={() => handleTransactionClick(transaction.id)}>
                  <IonCardContent className={styles.transactionContent}>
                    <div className={styles.transactionInfo}>
                      <div className={styles.row}>
                        <IonText className={styles.amount}>{formatAmount(transaction.amount)}</IonText>
                        <IonText className={`${styles.status} ${styles[transaction.status]}`}>
                          {getStatusText(transaction.status)}
                        </IonText>
                      </div>
                      <div className={styles.row}>
                        <IonText className={styles.time}>{formatTime(transaction.timestamp)}</IonText>
                        <IonText className={styles.transactionId}>{transaction.id}</IonText>
                      </div>
                    </div>
                    <IonIcon icon={chevronForward} className={styles.chevron} />
                  </IonCardContent>
                </IonCard>
              </motion.div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Transactions

