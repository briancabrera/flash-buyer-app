// Simula la publicación de un pago al backend
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const publishPayment = async (amount: number): Promise<{ success: boolean; transactionId: string }> => {
    // Simulamos un delay para imitar una llamada a la red
    await new Promise((resolve) => setTimeout(resolve, 1000))
  
    // Simulamos una respuesta exitosa con un ID de transacción aleatorio
    const transactionId = Math.random().toString(36).substr(2, 9)
  
    return {
      success: true,
      transactionId,
    }
  }
  
  