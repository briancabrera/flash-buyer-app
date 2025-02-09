// Simula la búsqueda de una transacción por ID
export const findTransactionById = async (
    id: string,
  ): Promise<{
    success: boolean
    transaction?: {
      id: string
      amount: number
      status: "completed" | "pending" | "rejected"
      timestamp: string
    }
    error?: string
  }> => {
    // Simulamos un delay para imitar una llamada a la red
    await new Promise((resolve) => setTimeout(resolve, 1000))
  
    // Mock data
    const transactions = {
      "TX-001": { id: "TX-001", amount: 1500, status: "completed" as const, timestamp: "2025-02-09T10:30:15" },
      "TX-002": { id: "TX-002", amount: 2000, status: "completed" as const, timestamp: "2025-02-09T11:45:30" },
      "TX-003": { id: "TX-003", amount: 500, status: "rejected" as const, timestamp: "2025-02-09T14:15:45" },
      "TX-004": { id: "TX-004", amount: 3000, status: "pending" as const, timestamp: "2025-02-09T16:00:20" },
    }
  
    const transaction = transactions[id as keyof typeof transactions]
  
    if (!transaction) {
      return {
        success: false,
        error: "Transacción no encontrada",
      }
    }
  
    if (transaction.status !== "completed") {
      return {
        success: false,
        error: "Solo se pueden realizar devoluciones de transacciones completadas",
      }
    }
  
    return {
      success: true,
      transaction,
    }
  }
  
  // Simula el proceso de devolución
  export const processRefund = async (
    transactionId: string,
    amount: number,
  ): Promise<{
    success: boolean
    refundId?: string
    error?: string
  }> => {
    // Simulamos un delay para imitar una llamada a la red
    await new Promise((resolve) => setTimeout(resolve, 2000))
  
    // Simulamos un 80% de éxito en las devoluciones
    const success = Math.random() > 0.2
  
    if (success) {
      return {
        success: true,
        refundId: `RF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      }
    }
  
    return {
      success: false,
      error: "Error al procesar la devolución",
    }
  }
  
  