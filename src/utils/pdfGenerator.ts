import jsPDF from "jspdf"
import "jspdf-autotable"
import { formatAmount } from "./formatters"

interface Transaction {
  id: string
  description: string
  amount: number
  status: "completed" | "pending" | "rejected"
  cardName: string
  cardLastDigits: string
  date: string
  time: string
  reference: string
}

export const generateTransactionReceipt = (transaction: Transaction): Promise<string> => {
  return new Promise((resolve, reject) => {
    const doc = new jsPDF()

    // Add content to the PDF
    doc.setFontSize(30)
    doc.setTextColor(56, 128, 255) // #3880ff in RGB (Flash Vendor primary color)
    doc.text("Flash Vendor", 105, 20, { align: "center" })

    doc.setFontSize(18)
    doc.setTextColor(0)
    doc.text("Comprobante de Transacción", 105, 30, { align: "center" })

    doc.setFontSize(22)
    doc.setTextColor(56, 128, 255)
    doc.text(formatAmount(transaction.amount), 105, 45, { align: "center" })

    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(transaction.description, 105, 55, { align: "center" })

    // Status
    const statusText = getStatusText(transaction.status)
    const statusColor = getStatusColor(transaction.status)
    doc.setFillColor(...statusColor)
    doc.rect(65, 60, 80, 10, "F")
    doc.setTextColor(255)
    doc.text(statusText, 105, 67, { align: "center" })

    doc.setTextColor(0)
    doc.setFontSize(14)
    doc.text("Detalles de la transacción", 20, 80)

    // Table
    ;(doc as any).autoTable({
      startY: 85,
      head: [["Campo", "Valor"]],
      body: [
        ["Fecha", transaction.date],
        ["Hora", transaction.time],
        ["Tarjeta", `${transaction.cardName} •••• ${transaction.cardLastDigits}`],
        ["Referencia", transaction.reference],
        ["ID de Transacción", transaction.id],
      ],
      theme: "striped",
      headStyles: { fillColor: [56, 128, 255] },
    })

    doc.setFontSize(10)
    doc.setTextColor(127, 140, 141)
    doc.text("Este es un comprobante generado electrónicamente por Flash.", 105, 280, { align: "center" })

    // Generate PDF as data URL
    const pdfOutput = doc.output("dataurlstring")
    resolve(pdfOutput)
  })
}

const getStatusText = (status: string): string => {
  switch (status) {
    case "completed":
      return "Completado"
    case "pending":
      return "Pendiente"
    case "rejected":
      return "Rechazado"
    default:
      return "Estado no disponible"
  }
}

const getStatusColor = (status: string): [number, number, number] => {
  switch (status) {
    case "completed":
      return [46, 204, 113] // #2ecc71 in RGB
    case "pending":
      return [241, 196, 15] // #f1c40f in RGB
    case "rejected":
      return [231, 76, 60] // #e74c3c in RGB
    default:
      return [127, 140, 141] // #7f8c8d in RGB
  }
}

